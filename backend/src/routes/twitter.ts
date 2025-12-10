import { Router, Request, Response } from "express";
import { TwitterApi } from "twitter-api-v2";
import TwitterToken from "../models/TwitterToken";
import TwitterRequestToken from "../models/TwitterRequestToken";
import { protect } from "../middleware/auth";

const router = Router();

// STEP 1 — Redirect to Twitter OAuth
router.get("/auth", async (req, res) => {
  const userId = req.query.userId as string;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;
  const port = process.env.PORT || 5000;
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
  const callbackUrl = process.env.TWITTER_CALLBACK_URL || `${backendUrl}/api/twitter/callback`;

  if (!appKey || !appSecret) {
    console.error("Twitter API credentials missing:", { hasAppKey: !!appKey, hasAppSecret: !!appSecret });
    return res.status(500).json({ error: "Twitter API credentials are not configured" });
  }

  try {
    // Create a client with only app credentials (no user tokens yet)
    const client = new TwitterApi({
      appKey,
      appSecret,
    });

    console.log("Generating Twitter OAuth link with callback URL:", callbackUrl);
    console.log("Twitter API credentials check:", { 
      hasAppKey: !!appKey, 
      hasAppSecret: !!appSecret,
      appKeyLength: appKey?.length,
      appSecretLength: appSecret?.length
    });

    // Generate OAuth 1.0a authorization link
    let authLink;
    try {
      console.log("Attempting to generate Twitter Auth Link...");
      // generateAuthLink performs a network request to Twitter to get a Request Token, so it MUST be awaited
      authLink = await client.generateAuthLink(callbackUrl, {
        linkMode: 'authorize', // Use 'authorize' to get user consent
      });
      
      console.log("Auth link generated successfully");
    } catch (linkError: any) {
      console.error("Error generating auth link:", {
        message: linkError.message,
        code: linkError.code,
        data: linkError.data,
        error: linkError
      });
      
      // Check specifically for 403 Callback URL error
      if (linkError.code === 403 || (linkError.data && JSON.stringify(linkError.data).includes('Callback URL not approved'))) {
        console.error(`
================================================================================
CRITICAL CONFIGURATION ERROR: Callback URL not approved
--------------------------------------------------------------------------------
Twitter refused the callback URL: ${callbackUrl}

ACTION REQUIRED:
1. Go to Twitter Developer Portal (https://developer.twitter.com/en/portal/dashboard)
2. Select your App -> Settings -> User authentication settings
3. Edit "Callback URLs"
4. Add exactly this URL: ${callbackUrl}
5. Save changes
================================================================================
        `);
      }
      throw linkError;
    }

    // Validate that we got the required tokens
    // Check both possible return formats: { oauth_token, oauth_token_secret } or { url, oauth_token_secret }
    const oauthToken = authLink.oauth_token || (authLink.url ? new URL(authLink.url).searchParams.get('oauth_token') : null);
    const oauthTokenSecret = authLink.oauth_token_secret;

    if (!oauthToken || !oauthTokenSecret) {
      console.error("Invalid authLink response:", {
        authLink,
        hasOAuthToken: !!authLink?.oauth_token,
        hasOAuthTokenSecret: !!authLink?.oauth_token_secret,
        hasUrl: !!authLink?.url,
        authLinkType: typeof authLink,
        authLinkKeys: authLink ? Object.keys(authLink) : 'null',
        extractedOAuthToken: oauthToken
      });
      throw new Error("Failed to generate OAuth tokens from Twitter API. Check your API credentials and callback URL configuration in Twitter Developer Portal.");
    }

    console.log("Twitter OAuth link generated successfully, oauth_token:", oauthToken.substring(0, 10) + "...");

    // Store the oauth_token and secret in the database
    // This is required because Twitter OAuth 1.0a callbacks don't guarantee returning the state parameter
    await TwitterRequestToken.create({
      oauthToken: oauthToken,
      oauthTokenSecret: oauthTokenSecret,
      userId: userId
    });

    // Redirect to Twitter authorization page
    // We don't rely on state parameter for OAuth 1.0a flow anymore
    const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`;
    
    console.log("Twitter OAuth redirect URL generated successfully");
    console.log("Redirecting to:", authUrl.substring(0, 100) + "...");
    res.redirect(authUrl);
  } catch (error: any) {
    console.error("Twitter OAuth error:", {
      message: error.message,
      code: error.code,
      data: error.data,
      response: error.response?.data,
      stack: error.stack
    });
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/socialdashboard?twitter=error&reason=oauth_init_failed`);
  }
});

// STEP 2 — Receive Twitter OAuth callback
router.get("/callback", async (req, res) => {
  const oauthToken = req.query.oauth_token as string;
  const oauthVerifier = req.query.oauth_verifier as string;
  const denied = req.query.denied as string;

  console.log("Twitter Callback Received:", {
    oauthToken: oauthToken ? 'present' : 'missing',
    oauthVerifier: oauthVerifier ? 'present' : 'missing',
    denied
  });

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

  // Retrieve the request token from database
  let requestTokenDoc;
  try {
    requestTokenDoc = await TwitterRequestToken.findOne({ oauthToken });
    
    if (!requestTokenDoc) {
      console.error("Twitter OAuth: Invalid or expired oauth_token");
      const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${clientUrl}/socialdashboard?twitter=error&reason=invalid_token`);
    }
  } catch (error) {
    console.error("Database error retrieving request token:", error);
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/socialdashboard?twitter=error&reason=db_error`);
  }

  const { userId, oauthTokenSecret } = requestTokenDoc;

  if (!userId || !oauthTokenSecret) {
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
      accessSecret: oauthTokenSecret,
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

    // Clean up the used request token
    await TwitterRequestToken.deleteOne({ _id: requestTokenDoc._id });

    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/socialdashboard?twitter=connected`);
  } catch (error: any) {
    console.error("Twitter OAuth callback error:", error?.response?.data || error.message || error);
    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/socialdashboard?twitter=error&reason=token_exchange_failed`);
  }
});

// STEP 3 — Disconnect Twitter account
router.delete("/disconnect", protect, async (req: any, res) => {
  const userId = req.user._id;
  
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
router.get("/status", protect, async (req: any, res) => {
  const userId = req.user._id;
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

