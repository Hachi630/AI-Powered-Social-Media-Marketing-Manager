import express, { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { protect } from "../middleware/auth.js";
import { AuthRequest } from "../types/index.js";
import { verifyGoogleToken } from "../utils/googleAuth.js";
import axios from "axios";
import crypto from "crypto";

dotenv.config();

// Validate Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:5000/api/auth/google/callback";

if (
  !GOOGLE_CLIENT_ID ||
  !GOOGLE_CLIENT_SECRET ||
  GOOGLE_CLIENT_ID === "your_google_client_id_here" ||
  GOOGLE_CLIENT_SECRET === "your_google_client_secret_here"
) {
  console.warn(
    "⚠️  Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env"
  );
}

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

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
    // Check MongoDB connection before proceeding
    if (mongoose.connection.readyState !== 1) {
      console.error('[Register] MongoDB not connected. ReadyState:', mongoose.connection.readyState)
      return res.status(503).json({ 
        success: false, 
        message: 'Database connection error. Please check your MongoDB connection and try again.' 
      })
    }

    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    // Normalize email to lowercase (matching schema behavior)
    const normalizedEmail = email.toLowerCase().trim();

    // Validate password is provided and not empty
    if (!password || password.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    // Check if user exists
    let userExists;
    try {
      userExists = await User.findOne({ email: normalizedEmail });
    } catch (dbError: any) {
      console.error('[Register] Database error checking existing user:', dbError);
      if (dbError.message?.includes('buffering timed out') || dbError.message?.includes('ECONNREFUSED') || dbError.message?.includes('querySrv')) {
        return res.status(503).json({ 
          success: false, 
          message: 'Database connection error. Unable to connect to MongoDB. Please check your MongoDB connection.' 
        });
      }
      throw dbError; // Re-throw if it's a different error
    }

    if (userExists) {
      console.log(`[Register] User already exists: ${normalizedEmail}`);
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    console.log(`[Register] Creating user with email: ${normalizedEmail}`);

    // Create user (Store password in plain text as requested)
    // Explicitly set authProvider to ensure password requirement is met
    let user;
    try {
      user = await User.create({
        email: normalizedEmail,
        password: password.trim(),
        authProvider: 'local', // Explicitly set to ensure password is required
      });
      console.log(`[Register] User created successfully: ${user._id}`);
    } catch (dbError: any) {
      console.error('[Register] Database error creating user:', dbError);
      if (dbError.message?.includes('buffering timed out') || dbError.message?.includes('ECONNREFUSED') || dbError.message?.includes('querySrv')) {
        return res.status(503).json({ 
          success: false, 
          message: 'Database connection error. Unable to connect to MongoDB. Please check your MongoDB connection.' 
        });
      }
      throw dbError; // Re-throw if it's a different error
    }

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          brandName: user.brandName,
          phone: user.phone,
          birthday: user.birthday,
          gender: user.gender,
          address: user.address,
          aboutMe: user.aboutMe,
          avatar: user.avatar,
          industry: user.industry,
          toneOfVoice: user.toneOfVoice,
          knowledgeProducts: user.knowledgeProducts,
          targetAudience: user.targetAudience,
          authProvider: user.authProvider,
          onboardingCompleted: user.onboardingCompleted,
          productTypes: user.productTypes,
          productImages: user.productImages,
          meloGoals: user.meloGoals,
          createdAt: user.createdAt,
        },
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid user data" });
    }
  } catch (error: any) {
    console.error('[Register] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    
    // Provide detailed error message
    let errorMessage = 'Failed to register user'
    
    if (error.message) {
      errorMessage = error.message
    } else if (error instanceof Error) {
      errorMessage = error.toString()
    }
    
    // Provide more specific error messages based on error type
    if (error.code === 11000 || error.message?.includes('duplicate') || error.message?.includes('E11000')) {
      errorMessage = 'User with this email already exists'
    } else if (error.name === 'ValidationError' && error.errors) {
      const validationErrors = Object.values(error.errors).map((val: any) => val.message).join(', ')
      errorMessage = `Validation error: ${validationErrors}`
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message?.includes('ECONNREFUSED') || error.message?.includes('querySrv')) {
      errorMessage = 'Database connection error. Unable to connect to MongoDB. Please check your MongoDB connection string and network settings.'
    } else if (error.name === 'MongooseError' || error.name === 'MongoError' || error.name === 'MongoServerError') {
      errorMessage = 'Database error occurred. Please check your MongoDB connection and try again.'
    } else if (error.message?.includes('password')) {
      errorMessage = error.message
    } else if (error.message?.includes('buffering timed out') || error.message?.includes('buffering')) {
      errorMessage = 'Database connection timeout. MongoDB is not connected. Please check your MongoDB connection and restart the backend server.'
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
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

    // Normalize email to lowercase (matching schema behavior)
    const normalizedEmail = email.toLowerCase().trim();

    // Check for user
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`[Login] User not found for email: ${normalizedEmail}`);
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Check password (plain text comparison as requested)
    if (user.password !== password) {
      console.log(`[Login] Password mismatch for email: ${normalizedEmail}`);
      console.log(`[Login] Expected: ${user.password}, Got: ${password}`);
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        brandName: user.brandName,
        phone: user.phone,
        birthday: user.birthday,
        gender: user.gender,
        address: user.address,
        aboutMe: user.aboutMe,
        avatar: user.avatar,
        industry: user.industry,
        toneOfVoice: user.toneOfVoice,
        knowledgeProducts: user.knowledgeProducts,
        targetAudience: user.targetAudience,
        authProvider: user.authProvider,
        onboardingCompleted: user.onboardingCompleted,
        productTypes: user.productTypes,
        productImages: user.productImages,
        meloGoals: user.meloGoals,
        createdAt: user.createdAt,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Login/Register with Google OAuth
// @route   POST /api/auth/google
// @access  Public
router.post("/google", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    // Validate ID token
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required",
      });
    }

    // Verify Google token
    let googleUser;
    try {
      googleUser = await verifyGoogleToken(idToken);
      console.log('[Google OAuth] User info from Google:', {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture ? googleUser.picture.substring(0, 100) + '...' : 'NOT PROVIDED',
        has_picture: !!googleUser.picture,
        sub: googleUser.sub
      });
    } catch (error: any) {
      console.error('[Google OAuth] Token verification failed:', error);
      return res.status(401).json({
        success: false,
        message: error.message || "Invalid Google token",
      });
    }

    // Check if user exists by Google ID
    let user = await User.findOne({ googleId: googleUser.sub });

    // If not found by Google ID, check by email
    if (!user) {
      user = await User.findOne({ email: googleUser.email });
    }

    if (user) {
      // Update existing user with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        user.authProvider = "google"; // Set auth provider for Google OAuth users
      }
      // Update user info from Google if available
      if (googleUser.name && !user.name) {
        user.name = googleUser.name;
      }
      // Always update avatar from Google if available (keeps it in sync)
      if (googleUser.picture) {
        user.avatar = googleUser.picture;
        console.log('[Google OAuth] Updated user avatar from Google:', googleUser.picture);
      } else {
        console.log('[Google OAuth] No picture provided by Google for user:', googleUser.email);
      }
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        email: googleUser.email,
        googleId: googleUser.sub,
        name: googleUser.name,
        avatar: googleUser.picture,
        authProvider: "google", // Set auth provider to avoid password validation
        // Password is not required for Google OAuth users
      });
    }

    // Log avatar for debugging
    console.log('[Google OAuth] Returning user with avatar:', {
      userId: user._id.toString(),
      email: user.email,
      avatar: user.avatar,
      hasAvatar: !!user.avatar
    });

    // Return user and token
    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        brandName: user.brandName,
        phone: user.phone,
        birthday: user.birthday,
        gender: user.gender,
        address: user.address,
        aboutMe: user.aboutMe,
        avatar: user.avatar || undefined, // Ensure avatar is included even if null
        industry: user.industry,
        toneOfVoice: user.toneOfVoice,
        knowledgeProducts: user.knowledgeProducts,
        targetAudience: user.targetAudience,
        authProvider: user.authProvider,
        onboardingCompleted: user.onboardingCompleted,
        productTypes: user.productTypes,
        productImages: user.productImages,
        meloGoals: user.meloGoals,
        createdAt: user.createdAt,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    console.error("[Google OAuth] Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    
    // Provide detailed error message
    let errorMessage = "Failed to authenticate with Google"
    
    if (error.message) {
      errorMessage = error.message
    } else if (error instanceof Error) {
      errorMessage = error.toString()
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    // Provide more specific error messages based on error type
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = "Database connection error. Please try again."
    } else if (error.name === 'MongooseError' || error.name === 'MongoError') {
      errorMessage = "Database error occurred. Please try again."
    } else if (error.message?.includes('token')) {
      errorMessage = error.message
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
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

    // If user has companies array, use it; otherwise, create from single company fields (backward compatibility)
    let companies = user.companies || [];

    // If no companies but has single company fields, create a company from those fields
    if (
      companies.length === 0 &&
      (user.brandName || user.industry || user.toneOfVoice)
    ) {
      companies = [
        {
          id: `company_${Date.now()}`,
          name: user.brandName || "My Company",
          brandName: user.brandName || "",
          industry: user.industry || "",
          toneOfVoice: user.toneOfVoice || "calm",
          customTone: "",
          knowledgeProducts: user.knowledgeProducts || [],
          targetAudience: user.targetAudience || [],
          companyDescription: "",
          brandLogoUrl: user.brandLogoUrl || "",
        },
      ];
    }

    console.log('[GET /me] Returning user data:', {
      id: user._id.toString(),
      email: user.email,
      avatar: user.avatar,
      hasAvatar: !!user.avatar,
      authProvider: user.authProvider
    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        brandName: user.brandName,
        brandLogoUrl: user.brandLogoUrl,
        phone: user.phone,
        birthday: user.birthday,
        gender: user.gender,
        address: user.address,
        aboutMe: user.aboutMe,
        avatar: user.avatar || undefined, // Explicitly ensure avatar is included
        industry: user.industry,
        toneOfVoice: user.toneOfVoice,
        knowledgeProducts: user.knowledgeProducts,
        targetAudience: user.targetAudience,
        companies: companies,
        authProvider: user.authProvider,
        onboardingCompleted: user.onboardingCompleted,
        productTypes: user.productTypes,
        productImages: user.productImages,
        meloGoals: user.meloGoals,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put("/profile", protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Extract allowed fields from request body
    const {
      name,
      brandName,
      brandLogoUrl,
      phone,
      birthday,
      gender,
      address,
      aboutMe,
      avatar,
      industry,
      toneOfVoice,
      knowledgeProducts,
      targetAudience,
      companies,
    } = req.body;

    // Log incoming companies data for debugging
    if (companies !== undefined) {
      console.log(
        "[Profile Update] Received companies data:",
        JSON.stringify(companies, null, 2)
      );
    }

    // Update user fields
    if (name !== undefined) user.name = name;
    if (brandName !== undefined) user.brandName = brandName;
    if (brandLogoUrl !== undefined) user.brandLogoUrl = brandLogoUrl;
    if (phone !== undefined) user.phone = phone;
    if (birthday !== undefined) user.birthday = birthday;
    if (gender !== undefined) user.gender = gender;
    if (address !== undefined) user.address = address;
    if (aboutMe !== undefined) user.aboutMe = aboutMe;
    if (avatar !== undefined) user.avatar = avatar;
    if (industry !== undefined) user.industry = industry;
    if (toneOfVoice !== undefined) user.toneOfVoice = toneOfVoice;
    if (knowledgeProducts !== undefined)
      user.knowledgeProducts = knowledgeProducts;
    if (targetAudience !== undefined) user.targetAudience = targetAudience;

    // Update companies array if provided
    if (companies !== undefined) {
      // Validate companies array length (max 10)
      if (Array.isArray(companies) && companies.length > 10) {
        return res.status(400).json({
          success: false,
          message: "Maximum 10 companies allowed",
        });
      }

      // Sanitize and ensure all company fields are properly formatted
      if (Array.isArray(companies)) {
        const sanitizedCompanies = companies.map((company: any) => ({
          id: String(company.id || `company_${Date.now()}`),
          name: String(company.name || ""),
          brandName: String(company.brandName || ""),
          industry: String(company.industry || ""),
          toneOfVoice: String(company.toneOfVoice || "calm"),
          customTone: String(company.customTone || ""),
          knowledgeProducts: Array.isArray(company.knowledgeProducts)
            ? company.knowledgeProducts.map((p: any) => String(p))
            : [],
          targetAudience: Array.isArray(company.targetAudience)
            ? company.targetAudience.map((a: any) => String(a))
            : [],
          companyDescription: String(company.companyDescription || ""),
          brandLogoUrl: String(company.brandLogoUrl || ""),
        }));

        console.log(
          "[Profile Update] Sanitized companies:",
          JSON.stringify(sanitizedCompanies, null, 2)
        );
        user.companies = sanitizedCompanies;
      } else {
        user.companies = companies;
      }
      // Mark companies as modified to ensure Mongoose saves nested array changes
      user.markModified("companies");
    }

    // Save updated user
    console.log(
      "[Profile Update] Attempting to save user with companies count:",
      user.companies?.length || 0
    );
    await user.save();
    console.log("[Profile Update] User saved successfully");

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        brandName: user.brandName,
        brandLogoUrl: user.brandLogoUrl,
        phone: user.phone,
        birthday: user.birthday,
        gender: user.gender,
        address: user.address,
        aboutMe: user.aboutMe,
        avatar: user.avatar,
        industry: user.industry,
        toneOfVoice: user.toneOfVoice,
        knowledgeProducts: user.knowledgeProducts,
        targetAudience: user.targetAudience,
        companies: user.companies || [],
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[Profile Update] Error saving profile:", error);
    console.error("[Profile Update] Error details:", error.message);
    if (error.errors) {
      console.error(
        "[Profile Update] Validation errors:",
        JSON.stringify(error.errors, null, 2)
      );
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Change user password
// @route   PUT /api/auth/password
// @access  Private
router.put("/password", protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if user is a local auth user (not Google)
    if (user.authProvider !== "local") {
      return res.status(400).json({
        success: false,
        message:
          "Password change is only available for local authentication users",
      });
    }

    const { newPassword } = req.body;

    // Validate new password
    if (!newPassword || newPassword.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a new password" });
    }

    // Update password (plain text as per existing implementation)
    user.password = newPassword.trim();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
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
// @desc    Initiate Google OAuth login
// @route   GET /api/auth/google
// @access  Public
router.get("/google", (req: Request, res: Response) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      prompt: "consent",
    });
    res.redirect(authUrl);
  } catch (error: any) {
    console.error("Error generating Google OAuth URL:", error);
    // Let Google show the error instead of redirecting to frontend
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/?error=google_oauth_error`);
  }
});

// Config check endpoints so frontend can quickly verify provider setup
router.get("/google/config", (req: Request, res: Response) => {
  const configured = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  res.json({ configured });
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/?error=oauth_failed`
      );
    }

    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload) {
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/?error=oauth_failed`
      );
    }

    const { email, sub: googleId, name, picture } = payload;

    if (!email) {
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/?error=no_email`
      );
    }

    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
        if (name) user.name = name;
        if (picture) user.avatar = picture;
        await user.save();
      }
    } else {
      user = await User.create({
        email,
        googleId,
        name: name || "",
        avatar: picture || "",
        authProvider: "google",
      });
    }

    const token = generateToken(user._id.toString());

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error: any) {
    console.error("Google OAuth error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/?error=oauth_failed`);
  }
});

// ----------------------------
// Microsoft OAuth
// ----------------------------
router.get("/microsoft", (req: Request, res: Response) => {
  if (
    !process.env.MICROSOFT_CLIENT_ID ||
    !process.env.MICROSOFT_CLIENT_SECRET
  ) {
    const html = `
      <html>
      <body style="font-family: Helvetica, Arial, sans-serif; text-align:center;">
        <h2>Microsoft OAuth is not configured</h2>
        <p>Please add <code>MICROSOFT_CLIENT_ID</code> and <code>MICROSOFT_CLIENT_SECRET</code> to your backend <code>.env</code> and restart the server.</p>
        <p>See README for details.</p>
      </body>
      </html>`;
    return res.status(500).send(html);
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

router.get("/microsoft/config", (req: Request, res: Response) => {
  const configured = !!(
    process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
  );
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
    res.redirect(
      `${frontendUrl}/auth/callback?error=${encodeURIComponent(err.message)}`
    );
  }
});

// @desc    Complete onboarding process
// @route   POST /api/auth/onboarding
// @access  Private
router.post("/onboarding", protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const {
      brandName,
      targetAudience,
      productTypes,
      productImages,
      meloGoals,
    } = req.body;

    // Get or create first company
    let companies = user.companies || [];
    let firstCompany;
    
    if (companies.length === 0) {
      // Create new company if user has no companies
      firstCompany = {
        id: `company_${Date.now()}`,
        name: brandName || 'My Company',
        brandName: brandName || '',
        industry: '',
        toneOfVoice: 'calm',
        customTone: '',
        knowledgeProducts: [],
        targetAudience: targetAudience || [],
        companyDescription: '',
        brandLogoUrl: '',
        productTypes: productTypes || [],
        productImages: productImages || [],
        meloGoals: meloGoals || [],
      };
      companies = [firstCompany];
    } else {
      // Update first company
      firstCompany = companies[0];
      if (brandName !== undefined) {
        firstCompany.brandName = brandName;
        firstCompany.name = brandName || firstCompany.name;
      }
      if (targetAudience !== undefined) firstCompany.targetAudience = targetAudience;
      if (productTypes !== undefined) firstCompany.productTypes = productTypes;
      if (productImages !== undefined) firstCompany.productImages = productImages;
      if (meloGoals !== undefined) firstCompany.meloGoals = meloGoals;
      companies[0] = firstCompany;
    }

    // Update user companies array
    user.companies = companies;
    
    // Also update user-level brandName for backward compatibility
    if (brandName !== undefined) user.brandName = brandName;
    
    // Mark onboarding as completed
    user.onboardingCompleted = true;

    await user.save();

    // Return updated user with companies
    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        brandName: user.brandName,
        companies: user.companies,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
