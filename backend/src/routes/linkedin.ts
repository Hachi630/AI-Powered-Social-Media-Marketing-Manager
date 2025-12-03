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
router.get("/auth", (_req, res) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LI_CLIENT_ID!,
    redirect_uri: process.env.LI_REDIRECT_URI!,
    scope: "r_liteprofile r_member_social",
    state: Math.random().toString(36),
  });

  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

// STEP 2 — Receive LinkedIn code, exchange for token
router.get("/callback", async (req, res) => {
  const code = req.query.code as string;

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

  // You already have users, attach LinkedIn token to logged-in user
  const userId = req.query.stateUserId; // from frontend URL

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
