import { Router } from "express";
import qs from "qs";
import axios from "axios";

import LinkedInToken from "../models/LinkedInToken";
import { signToken } from "../utils/jwt";
import { requireAuth } from "../middleware/auth";
import {
  getLinkedInMemberId,
  getTotalConnections,
  getLinkedInFollowers,
  getProfileViews,
} from "../services/linkedinService";

const router = Router();

// STEP 1 — Redirect to LinkedIn OAuth
// Bug 1 Fix: Accept userId as query param and encode it in state
router.get("/auth", (req, res) => {
  const userId = req.query.userId as string;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // Encode userId in state so we can retrieve it in callback
  const state = JSON.stringify({ userId, nonce: Math.random().toString(36) });
  const encodedState = Buffer.from(state).toString('base64');

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LI_CLIENT_ID!,
    redirect_uri: process.env.LI_REDIRECT_URI!,
    scope: "r_liteprofile r_member_social",
    state: encodedState,
  });

  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

// STEP 2 — Receive LinkedIn code, exchange for token
// Bug 2 Fix: Add try-catch error handling
router.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  const stateParam = req.query.state as string;

  // Bug 1 Fix: Decode userId from state parameter
  let userId: string | undefined;
  try {
    const decodedState = Buffer.from(stateParam, 'base64').toString('utf-8');
    const stateData = JSON.parse(decodedState);
    userId = stateData.userId;
  } catch {
    return res.redirect(`${process.env.CLIENT_URL}/dashboard?linkedin=error&reason=invalid_state`);
  }

  if (!userId) {
    return res.redirect(`${process.env.CLIENT_URL}/dashboard?linkedin=error&reason=missing_user`);
  }

  try {
    const body = qs.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.LI_REDIRECT_URI!,
      client_id: process.env.LI_CLIENT_ID!,
      client_secret: process.env.LI_CLIENT_SECRET!,
    });

    const { data } = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      body,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = data.access_token;

    // Get LinkedIn user ID
    const liMemberId = await getLinkedInMemberId(accessToken);

    await LinkedInToken.findOneAndUpdate(
      { userId },
      {
        userId,
        liMemberId,
        accessToken,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
      { upsert: true }
    );

    res.redirect(`${process.env.CLIENT_URL}/dashboard?linkedin=connected`);
  } catch (error) {
    console.error("LinkedIn OAuth error:", error);
    res.redirect(`${process.env.CLIENT_URL}/dashboard?linkedin=error&reason=token_exchange_failed`);
  }
});

// STEP 3 — Fetch metrics
router.get("/metrics", requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const token = await LinkedInToken.findOne({ userId });

  if (!token?.accessToken) {
    return res.json({
      followers: { available: false },
      connections: { available: false },
      profileViews: { available: false },
    });
  }

  const [followers, connections, profileViews] = await Promise.all([
    getLinkedInFollowers(token.accessToken),
    getTotalConnections(token.accessToken, token.liMemberId!),
    getProfileViews(),
  ]);

  res.json({
    followers: followers ? { available: true, value: followers } : { available: false },
    connections: connections ? { available: true, value: connections } : { available: false },
    profileViews: { available: false },
  });
});

export default router;
