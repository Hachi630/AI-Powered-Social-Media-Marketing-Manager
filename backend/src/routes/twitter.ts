import { Router, Request, Response } from "express";
import { TwitterApi } from "twitter-api-v2";
import TwitterToken from "../models/TwitterToken";
import { requireAuth } from "../middleware/auth";

const router = Router();

// STEP 1 — Redirect to Twitter OAuth
router.get("/auth", (req, res) => {
  const userId = req.query.userId as string;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;
  const callbackUrl = process.env.TWITTER_CALLBACK_URL || 
    `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/api/twitter/callback`;

  if (!appKey || !appSecret) {
    return res.status(500).json({ error: "Twitter API credentials are not configured" });
  }

  try {
    // Create a client with only app credentials (no user tokens yet)
    const client = new TwitterApi({
      appKey,
      appSecret,
    });

    // Encode userId in state so we can retrieve it in callback
    const state = JSON.stringify({ userId, nonce: Math.random().toString(36) });
    const encodedState = Buffer.from(state).toString('base64');

    // Generate OAuth 1.0a authorization link
    const authLink = client.generateAuthLink(callbackUrl, {
      linkMode: 'authorize', // Use 'authorize' to get user consent
    });

    // Store the oauth_token_secret temporarily (in a real app, you'd use Redis or session)
    // For now, we'll encode it in the state parameter
    const stateWithSecret = JSON.stringify({ 
      userId, 
      nonce: Math.random().toString(36),
      oauthTokenSecret: authLink.oauth_token_secret 
    });
    const finalState = Buffer.from(stateWithSecret).toString('base64');

    // Redirect to Twitter authorization page
    const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${authLink.oauth_token}&state=${finalState}`;
    
    console.log("Twitter OAuth redirect URL:", authUrl);
    res.redirect(authUrl);
  } catch (error: any) {
    console.error("Twitter OAuth error:", error);
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/socialdashboard?twitter=error&reason=oauth_init_failed`);
  }
});

// STEP 2 — Receive Twitter OAuth callback
router.get("/callback", async (req, res) => {
  const oauthToken = req.query.oauth_token as string;
  const oauthVerifier = req.query.oauth_verifier as string;
  const stateParam = req.query.state as string;
  const denied = req.query.denied as string;

  // Handle user denial
  if (denied) {
    console.error("Twitter OAuth denied by user");
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/socialdashboard?twitter=error&reason=user_denied`);
  }

  // Check if required parameters are present
  if (!oauthToken || !oauthVerifier) {
    console.error("Twitter OAuth: Missing oauth_token or oauth_verifier");
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/socialdashboard?twitter=error&reason=missing_params`);
  }

  // Decode userId and oauth_token_secret from state
  let userId: string | undefined;
  let oauthTokenSecret: string | undefined;
  try {
    const decodedState = Buffer.from(stateParam, 'base64').toString('utf-8');
    const stateData = JSON.parse(decodedState);
    userId = stateData.userId;
    oauthTokenSecret = stateData.oauthTokenSecret;
  } catch {
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/socialdashboard?twitter=error&reason=invalid_state`);
  }

  if (!userId) {
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/socialdashboard?twitter=error&reason=missing_user`);
  }

  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;

  if (!appKey || !appSecret) {
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/socialdashboard?twitter=error&reason=config_error`);
  }

  try {
    // Create a client with app credentials and temporary tokens
    const client = new TwitterApi({
      appKey,
      appSecret,
      accessToken: oauthToken,
      accessSecret: oauthTokenSecret!,
    });

    // Exchange oauth_verifier for access tokens
    const { client: loggedClient, accessToken, accessSecret } = await client.login(oauthVerifier);

    // Get user info to store twitterUserId
    const userMe = await loggedClient.v2.me();
    const twitterUserId = userMe.data.id;

    // Store tokens in database
    await TwitterToken.findOneAndUpdate(
      { userId },
      {
        userId,
        twitterUserId,
        accessToken,
        accessSecret,
        // OAuth 1.0a tokens don't expire, but we can set a far future date
        expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years
      },
      { upsert: true }
    );

    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/socialdashboard?twitter=connected`);
  } catch (error: any) {
    console.error("Twitter OAuth callback error:", error?.response?.data || error.message || error);
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/socialdashboard?twitter=error&reason=token_exchange_failed`);
  }
});

// STEP 3 — Disconnect Twitter account
router.delete("/disconnect", requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  
  try {
    const result = await TwitterToken.findOneAndDelete({ userId });
    
    if (!result) {
      return res.json({ success: true, message: "No Twitter account was connected" });
    }
    
    console.log(`Twitter disconnected for user ${userId}`);
    res.json({ success: true, message: "Twitter account disconnected successfully" });
  } catch (error: any) {
    console.error("Error disconnecting Twitter:", error.message);
    res.status(500).json({ success: false, error: "Failed to disconnect Twitter account" });
  }
});

// STEP 4 — Check connection status
router.get("/status", requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const token = await TwitterToken.findOne({ userId });

  if (!token?.accessToken || !token?.accessSecret) {
    return res.json({
      connected: false,
      profile: null,
    });
  }

  try {
    // Verify token is still valid by getting user info
    const appKey = process.env.TWITTER_API_KEY;
    const appSecret = process.env.TWITTER_API_SECRET;

    if (!appKey || !appSecret) {
      return res.json({
        connected: false,
        profile: null,
        error: "Twitter API credentials not configured",
      });
    }

    const client = new TwitterApi({
      appKey,
      appSecret,
      accessToken: token.accessToken,
      accessSecret: token.accessSecret,
    });

    const userMe = await client.v2.me();
    
    res.json({
      connected: true,
      profile: {
        id: userMe.data.id,
        username: userMe.data.username,
        name: userMe.data.name,
      },
    });
  } catch (error: any) {
    console.error("Error checking Twitter status:", error);
    // Token might be invalid, remove it
    await TwitterToken.findOneAndDelete({ userId });
    res.json({
      connected: false,
      profile: null,
      error: "Token validation failed",
    });
  }
});

export default router;

