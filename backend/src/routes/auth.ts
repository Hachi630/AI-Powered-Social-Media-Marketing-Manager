import express, { Request, Response } from "express";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import axios from "axios";
import crypto from "crypto";
import { protect } from "../middleware/auth";
import { AuthRequest } from "../types";

interface GoogleUser {
  email?: string;
  id?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

interface MicrosoftUser {
  mail?: string;
  userPrincipalName?: string;
  displayName?: string;
  id?: string;
}

const router = express.Router();
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Create user (Store password in plain text as requested)
    const user = await User.create({
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          createdAt: user.createdAt,
        },
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid user data" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    // Check for user
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Check password (plain text comparison as requested)
    if (user.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Log user out
// @route   POST /api/auth/logout
// @access  Private
router.post("/logout", protect, (req: Request, res: Response) => {
  // Client side should remove the token
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// ----------------------------
// Google OAuth
// ----------------------------
// Redirect to Google OAuth consent page
router.get("/google", (req: Request, res: Response) => {
  // Server-side checks for config to give clear error to developer instead of provider 403
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const html = `
      <html>
      <body style="font-family: Helvetica, Arial, sans-serif; text-align:center;">
        <h2>Google OAuth is not configured</h2>
        <p>Please add <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> to your backend <code>.env</code> and restart the server.</p>
        <p>See README for details.</p>
      </body>
      </html>`
    return res.status(500).send(html)
  }
  const state = crypto.randomBytes(16).toString("hex");
  // You can store state in a DB or session to validate in callback (omitted for brevity)

  const redirectUri = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
});

// Config check endpoints so frontend can quickly verify provider setup
router.get('/google/config', (req: Request, res: Response) => {
  const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  res.json({ configured })
})

// Callback for Google OAuth
router.get("/google/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  if (!code) {
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/callback?error=missing_code`
    );
  }

  try {
    const redirectUri = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/api/auth/google/callback`;

    // Exchange authorization code for access token
    const tokenResp = await axios.post<{ access_token: string }>(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const accessToken = tokenResp.data.access_token;

    // Request user profile
    const userInfoResp = await axios.get<GoogleUser>(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const googleUser = userInfoResp.data;
    const email = googleUser?.email;
    if (!email) {
      throw new Error("No email returned from Google");
    }

    // Find or create a user
    let user = await User.findOne({ email });
    if (!user) {
      // Use a random password for OAuth-created accounts (we store plaintext here per the project, though it's insecure)
      const randomPassword = crypto.randomBytes(16).toString("hex");
      user = await User.create({ email, password: randomPassword });
    }

    const token = generateToken(user._id.toString());
    // Redirect to frontend callback route with our token
    const frontendUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}`;
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (err: any) {
    console.error("Google OAuth callback error", err);
    const frontendUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}`;
    res.redirect(
      `${frontendUrl}/auth/callback?error=${encodeURIComponent(err.message)}`
    );
  }
});

// ----------------------------
// Microsoft OAuth
// ----------------------------
router.get("/microsoft", (req: Request, res: Response) => {
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    const html = `
      <html>
      <body style="font-family: Helvetica, Arial, sans-serif; text-align:center;">
        <h2>Microsoft OAuth is not configured</h2>
        <p>Please add <code>MICROSOFT_CLIENT_ID</code> and <code>MICROSOFT_CLIENT_SECRET</code> to your backend <code>.env</code> and restart the server.</p>
        <p>See README for details.</p>
      </body>
      </html>`
    return res.status(500).send(html)
  }
  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/api/auth/microsoft/callback`;
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID || "",
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: "openid email profile User.Read",
    state,
  });
  res.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  );
});

router.get('/microsoft/config', (req: Request, res: Response) => {
  const configured = !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
  res.json({ configured });
});
router.get("/microsoft/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  if (!code) {
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/callback?error=missing_code`
    );
  }

  try {
    const redirectUri = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`}/api/auth/microsoft/callback`;

    // Exchange authorization code for access token
    const tokenResp = await axios.post<{ access_token: string }>(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID || "",
        client_secret: process.env.MICROSOFT_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        scope: "openid email profile User.Read",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenResp.data.access_token;

    // Request user profile
    const userInfoResp = await axios.get<MicrosoftUser>(
      "https://graph.microsoft.com/v1.0/me",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const msUser = userInfoResp.data;
    const email = msUser.mail || msUser.userPrincipalName;
    if (!email) {
      throw new Error("No email returned from Microsoft");
    }

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString("hex");
      user = await User.create({ email, password: randomPassword });
    }

    const token = generateToken(user._id.toString());
    const frontendUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}`;
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (err: any) {
    console.error("Microsoft OAuth callback error", err);
    const frontendUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}`;
    res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(err.message)}`);
  }
});

export default router;
