import express, { Request, Response } from "express";
import axios from "axios";
import { protect } from "../middleware/auth.js";
import { AuthRequest } from "../types/index.js";
import User from "../models/User.js";
import {
  getInstagramAuthUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  getInstagramAccountIdForPage,
  getFacebookPagesWithInstagram,
  shareToInstagram,
} from "../services/instagramService.js";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { uploadToS3, isS3Configured, getS3PublicUrl } from "../services/s3Service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for image/video uploads
const UPLOADS_DIR = path.join(__dirname, "../../uploads/images");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `instagram-${timestamp}-${random}${ext}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images and videos
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit for videos
  },
});

// Store OAuth states temporarily (in production, use Redis or similar)
const oauthStates = new Map<string, string>();

/**
 * @desc    Initiate Instagram OAuth flow (requires Facebook Page, includes business_management)
 * @route   GET /api/instagram/auth
 * @access  Private
 */
router.get(
  "/auth",
  protect,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Generate state for CSRF protection
      const state = crypto.randomBytes(32).toString("hex");
      oauthStates.set(
        state,
        JSON.stringify({ userId: user._id.toString() })
      );

      // Generate Instagram OAuth URL (with business_management scope for Instagram Business Account)
      // Instagram requires Facebook Page, so this will also connect Facebook
      const authUrl = getInstagramAuthUrl(state, true); // true = include business_management for Instagram

      res.json({
        success: true,
        authUrl,
        state,
      });
    } catch (error: any) {
      console.error("[Instagram OAuth] Initiation error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to initiate Instagram OAuth",
      });
    }
  }
);

/**
 * @desc    Instagram OAuth callback (independent from Facebook)
 * @route   GET /api/instagram/callback
 * @access  Public (called by Facebook) or Private (called by frontend)
 */
router.get("/callback", async (req: Request, res: Response) => {
  try {
    console.log("[Instagram OAuth Callback] Received callback:", {
      query: req.query,
      url: req.url,
      headers: req.headers.host,
    });

    // Check if this is a frontend callback (has Authorization header) or backend callback (from Facebook)
    const isFrontendCallback = !!req.headers.authorization;
    console.log(
      "[Instagram OAuth Callback] Callback type:",
      isFrontendCallback ? "frontend" : "backend (from Facebook)"
    );

    const { code, state, error } = req.query;

    if (error) {
      console.error("[Instagram OAuth Callback] Error from Facebook:", error);
      if (isFrontendCallback) {
        return res.json({ success: false, message: error as string });
      }
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/instagram/callback?error=${encodeURIComponent(error as string)}`
      );
    }

    if (!code || !state) {
      console.error("[Instagram OAuth Callback] Missing code or state:", {
        code: !!code,
        state: !!state,
      });
      if (isFrontendCallback) {
        return res.json({ success: false, message: "Missing code or state" });
      }
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/instagram/callback?error=missing_code_or_state`
      );
    }

    // Verify state
    const stateString = state as string;
    const stateData = oauthStates.get(stateString);
    if (!stateData) {
      console.error(
        "[Instagram OAuth Callback] Invalid state - state not found:",
        {
          state: stateString?.substring(0, 20) + "...",
          stateLength: stateString?.length,
          oauthStatesSize: oauthStates.size,
        }
      );
      // Silently redirect without error (invalid state is common during OAuth flow)
      // This can happen if: 1) User refreshes the callback page, 2) OAuth callback is called multiple times
      // If connection was already successful, state would have been consumed, so we redirect with params
      // The frontend will check the actual connection status regardless
      console.log(
        "[Instagram OAuth Callback] Invalid state - but connection may already be successful, redirecting silently"
      );
      const clientUrl =
        process.env.CLIENT_URL ||
        process.env.FRONTEND_URL ||
        "http://localhost:3000";
      if (isFrontendCallback) {
        return res.json({
          success: true,
          message: "Redirecting to social dashboard",
          redirectUrl: `${clientUrl}/socialdashboard?instagram=connected`,
        });
      }
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/socialdashboard?instagram=connected`
      );
    }

    // Parse state data
    let userId: string;
    try {
      const parsed = JSON.parse(stateData as string);
      userId = parsed.userId || parsed;
    } catch (e) {
      console.warn(
        "[Instagram OAuth Callback] State data is not JSON, treating as userId string"
      );
      userId = stateData as string;
    }

    console.log(
      "[Instagram OAuth Callback] State verified, userId:",
      userId
    );

    // Delete state AFTER successful parsing to prevent reuse
    oauthStates.delete(stateString);

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      if (isFrontendCallback) {
        return res.json({ success: false, message: "User not found" });
      }
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/instagram/callback?error=user_not_found`
      );
    }

    // Exchange code for short-lived token
    console.log("[Instagram OAuth Callback] Exchanging code for token...");
    const tokenData = await exchangeCodeForToken(code as string);
    console.log("[Instagram OAuth Callback] Got short-lived token");

    // Exchange for long-lived token
    console.log(
      "[Instagram OAuth Callback] Exchanging for long-lived token..."
    );
    const longLivedToken = await getLongLivedToken(tokenData.accessToken);
    console.log("[Instagram OAuth Callback] Got long-lived token");

    // Get user's Facebook Pages with Instagram account information
    console.log("[Instagram OAuth Callback] Getting Facebook Pages with Instagram info...");
    const pages = await getFacebookPagesWithInstagram(longLivedToken.accessToken);
    console.log("[Instagram OAuth Callback] Found pages:", pages.length);
    console.log(
      "[Instagram OAuth Callback] Pages details:",
      pages.map((p: any) => ({
        id: p.id,
        name: p.name,
        hasInstagramAccount: p.hasInstagramAccount,
        instagramUsername: p.instagramUsername,
      }))
    );

    // Filter to only pages with Instagram accounts
    const pagesWithInstagram = pages.filter((page: any) => page.hasInstagramAccount);
    console.log(
      "[Instagram OAuth Callback] Pages with Instagram:",
      pagesWithInstagram.length
    );

    if (pagesWithInstagram.length === 0) {
      const pageNames = pages.map((p: any) => p.name).join(", ");
      console.log(
        "[Instagram OAuth Callback] No pages with Instagram detected. Pages:",
        pageNames
      );
      console.log(
        "[Instagram OAuth Callback] This might be a permissions issue. Attempting to proceed anyway..."
      );

      // If user has pages but we can't detect Instagram, still try to connect
      if (pages.length > 0) {
        const firstPage = pages[0];
        console.log(
          "[Instagram OAuth Callback] Attempting to connect using first page:",
          firstPage.name,
          "Page ID:",
          firstPage.id
        );

        try {
          // Try to get Instagram account directly using the page
          // Use long-lived token first, then fallback to page token
          const tokenToUse = longLivedToken.accessToken;
          console.log(
            "[Instagram OAuth Callback] Using token to get Instagram account. Token length:",
            tokenToUse.length
          );
          
          const instagramAccount = await getInstagramAccountIdForPage(
            firstPage.id,
            tokenToUse
          );

          // If we can get Instagram account, proceed with connection
          console.log(
            "[Instagram OAuth Callback] ✅ Successfully found Instagram account:",
            {
              username: instagramAccount.username,
              accountType: instagramAccount.accountType,
              instagramAccountId: instagramAccount.instagramAccountId,
              facebookPageId: instagramAccount.facebookPageId,
            }
          );

          // Calculate expiration date
          const expiresAt = new Date();
          expiresAt.setSeconds(
            expiresAt.getSeconds() + longLivedToken.expiresIn
          );

          // Save to user
          if (!user.socialConnections) {
            user.socialConnections = {};
          }

          // Save Instagram connection
          user.socialConnections.instagram = {
            accessToken: longLivedToken.accessToken,
            userId: instagramAccount.instagramAccountId,
            username: instagramAccount.username,
            accountType: instagramAccount.accountType,
            expiresAt,
          };

          // Also save Facebook Page connection (Instagram requires a Facebook Page)
          const pageToken = firstPage.accessToken || longLivedToken.accessToken;
          user.socialConnections.facebook = {
            accessToken: pageToken,
            userId: instagramAccount.facebookPageId,
            expiresAt,
          };

          await user.save();

          // Verify data was saved correctly
          const savedUser = await User.findById(user._id);
          console.log(
            "[Instagram OAuth Callback] Successfully connected:",
            {
              userId: user._id,
              instagramUsername: instagramAccount.username,
              facebookPageId: instagramAccount.facebookPageId,
              savedInstagramUserId: savedUser?.socialConnections?.instagram?.userId,
              savedInstagramUsername: savedUser?.socialConnections?.instagram?.username,
              savedInstagramAccessToken: savedUser?.socialConnections?.instagram?.accessToken ? "exists" : "missing",
            }
          );

          const clientUrl =
            process.env.CLIENT_URL ||
            process.env.FRONTEND_URL ||
            "http://localhost:3000";
          const redirectUrl = `${clientUrl}/socialdashboard?facebook=connected&instagram=connected`;

          if (isFrontendCallback) {
            return res.json({
              success: true,
              message: "Successfully connected Instagram and Facebook Page",
              redirectUrl,
              instagram: {
                userId: instagramAccount.instagramAccountId,
                username: instagramAccount.username,
                accountType: instagramAccount.accountType,
              },
              facebook: {
                pageId: instagramAccount.facebookPageId,
                pageName: instagramAccount.facebookPageName,
              },
            });
          } else {
            return res.redirect(redirectUrl);
          }
        } catch (directError: any) {
          console.error(
            "[Instagram OAuth Callback] Direct method failed:",
            {
              error: directError.message,
              response: directError.response?.data,
              status: directError.response?.status,
              pageId: firstPage.id,
              pageName: firstPage.name,
            }
          );
          
          // Try with page access token as fallback
          if (firstPage.accessToken && firstPage.accessToken !== longLivedToken.accessToken) {
            console.log(
              "[Instagram OAuth Callback] Trying with page access token as fallback..."
            );
            try {
              const instagramAccount = await getInstagramAccountIdForPage(
                firstPage.id,
                firstPage.accessToken
              );
              
              console.log(
                "[Instagram OAuth Callback] ✅ Successfully found Instagram account with page token:",
                {
                  username: instagramAccount.username,
                  accountType: instagramAccount.accountType,
                  instagramAccountId: instagramAccount.instagramAccountId,
                  facebookPageId: instagramAccount.facebookPageId,
                }
              );
              
              // Calculate expiration date
              const expiresAt = new Date();
              expiresAt.setSeconds(
                expiresAt.getSeconds() + longLivedToken.expiresIn
              );

              // Save to user
              if (!user.socialConnections) {
                user.socialConnections = {};
              }

              // Save Instagram connection
              user.socialConnections.instagram = {
                accessToken: longLivedToken.accessToken,
                userId: instagramAccount.instagramAccountId,
                username: instagramAccount.username,
                accountType: instagramAccount.accountType,
                expiresAt,
              };

              // Also save Facebook Page connection (Instagram requires a Facebook Page)
              const pageToken = firstPage.accessToken || longLivedToken.accessToken;
              user.socialConnections.facebook = {
                accessToken: pageToken,
                userId: instagramAccount.facebookPageId,
                expiresAt,
              };

              await user.save();

              // Verify data was saved correctly
              const savedUser = await User.findById(user._id);
              console.log(
                "[Instagram OAuth Callback] Successfully connected:",
                {
                  userId: user._id,
                  instagramUsername: instagramAccount.username,
                  facebookPageId: instagramAccount.facebookPageId,
                  savedInstagramUserId: savedUser?.socialConnections?.instagram?.userId,
                  savedInstagramUsername: savedUser?.socialConnections?.instagram?.username,
                  savedInstagramAccessToken: savedUser?.socialConnections?.instagram?.accessToken ? "exists" : "missing",
                }
              );

              const clientUrl =
                process.env.CLIENT_URL ||
                process.env.FRONTEND_URL ||
                "http://localhost:3000";
              const redirectUrl = `${clientUrl}/socialdashboard?facebook=connected&instagram=connected`;

              if (isFrontendCallback) {
                return res.json({
                  success: true,
                  message: "Successfully connected Instagram and Facebook Page",
                  redirectUrl,
                  instagram: {
                    userId: instagramAccount.instagramAccountId,
                    username: instagramAccount.username,
                    accountType: instagramAccount.accountType,
                  },
                  facebook: {
                    pageId: instagramAccount.facebookPageId,
                    pageName: instagramAccount.facebookPageName,
                  },
                });
              } else {
                return res.redirect(redirectUrl);
              }
            } catch (pageTokenError: any) {
              console.error(
                "[Instagram OAuth Callback] Page token method also failed:",
                pageTokenError.response?.data || pageTokenError.message
              );
            }
          }
          
          // Fall through to error
        }
      }

      // If we can't connect Instagram, return detailed error
      const errorDetails = pages.length > 0 
        ? `Found ${pages.length} Facebook Page(s) but couldn't detect Instagram account. This might be due to: 1) Instagram account not connected to Facebook Page, 2) Insufficient permissions (business_management scope), or 3) Instagram account is not a Business/Creator account.`
        : "No Facebook Pages found. Please create a Facebook Page and connect an Instagram Business/Creator account to it.";
      
      console.error("[Instagram OAuth Callback] Connection failed:", errorDetails);
      
      if (isFrontendCallback) {
        return res.json({
          success: false,
          message: `Failed to connect. Please ensure you have a Facebook Page with an Instagram Business/Creator account connected. ${errorDetails}`,
        });
      }
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/instagram/callback?error=no_instagram_account`
      );
    }

    // If only one page, connect it directly
    if (pagesWithInstagram.length === 1) {
      const selectedPage = pagesWithInstagram[0];

      // Get Instagram account for selected page
      const instagramAccount = await getInstagramAccountIdForPage(
        selectedPage.id,
        selectedPage.accessToken || longLivedToken.accessToken
      );

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + longLivedToken.expiresIn);

      // Save to user
      if (!user.socialConnections) {
        user.socialConnections = {};
      }

      // Save Instagram connection
      user.socialConnections.instagram = {
        accessToken: longLivedToken.accessToken,
        userId: instagramAccount.instagramAccountId,
        username: instagramAccount.username,
        accountType: instagramAccount.accountType,
        expiresAt,
      };

      // Also save Facebook Page connection
      const pageToken = selectedPage.accessToken || longLivedToken.accessToken;
      user.socialConnections.facebook = {
        accessToken: pageToken,
        userId: instagramAccount.facebookPageId,
        expiresAt,
      };

      await user.save();

      // Verify data was saved correctly
      const savedUser = await User.findById(user._id);
      console.log("[Instagram OAuth] Successfully connected single page:", {
        userId: user._id,
        instagramUserId: user.socialConnections.instagram?.userId,
        instagramUsername: user.socialConnections.instagram?.username,
        facebookPageId: user.socialConnections.facebook?.userId,
        savedInstagramUserId: savedUser?.socialConnections?.instagram?.userId,
        savedInstagramUsername: savedUser?.socialConnections?.instagram?.username,
        savedInstagramAccessToken: savedUser?.socialConnections?.instagram?.accessToken ? "exists" : "missing",
      });

      const clientUrl =
        process.env.CLIENT_URL ||
        process.env.FRONTEND_URL ||
        "http://localhost:3000";
      const redirectUrl = `${clientUrl}/socialdashboard?facebook=connected&instagram=connected`;

      if (isFrontendCallback) {
        return res.json({
          success: true,
          message: "Successfully connected Instagram and Facebook Page",
          redirectUrl,
          instagram: {
            userId: instagramAccount.instagramAccountId,
            username: instagramAccount.username,
            accountType: instagramAccount.accountType,
          },
          facebook: {
            pageId: instagramAccount.facebookPageId,
            pageName: instagramAccount.facebookPageName,
          },
        });
      } else {
        return res.redirect(redirectUrl);
      }
    } else {
      // Multiple pages - store token and redirect to selection page
      const tempTokenKey = `temp_token_${user._id}_${Date.now()}`;
      oauthStates.set(
        tempTokenKey,
        JSON.stringify({
          userId: user._id.toString(),
          accessToken: longLivedToken.accessToken,
          expiresIn: longLivedToken.expiresIn,
        })
      );

      // Redirect to page selection page with token key
      res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/select-facebook-page?token_key=${tempTokenKey}`
      );
    }
  } catch (error: any) {
    console.error("[Instagram OAuth Callback] Error:", error);
    console.error("[Instagram OAuth Callback] Error stack:", error.stack);
    const errorMessage =
      error.response?.data?.error?.message || error.message || "oauth_failed";
    console.error(
      "[Instagram OAuth Callback] Redirecting with error:",
      errorMessage
    );
    const clientUrl =
      process.env.CLIENT_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:3000";
    if (req.headers.authorization) {
      return res.json({
        success: false,
        message: errorMessage,
      });
    }
    res.redirect(
      `${clientUrl}/auth/instagram/callback?error=${encodeURIComponent(errorMessage)}`
    );
  }
});

/**
 * @desc    Share content to Instagram (with image/video upload support)
 * @route   POST /api/instagram/share
 * @access  Private
 */
router.post(
  "/share",
  protect,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // IMPORTANT: Reload user from database to get latest socialConnections
      const freshUser = await User.findById(user._id);
      if (!freshUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Parse FormData - content and calendarItemId come from req.body (multer parses FormData)
      const { calendarItemId, content, imageUrl } = req.body;
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;
      const imageFile = files?.image?.[0];
      const videoFile = files?.video?.[0];

      console.log("[Instagram Share] Request received:", {
        userId: freshUser._id,
        calendarItemId,
        hasContent: !!content,
        hasImageUrl: !!imageUrl,
        hasImageFile: !!imageFile,
        hasVideoFile: !!videoFile,
        socialConnections: freshUser.socialConnections ? "exists" : "null",
        instagramToken: freshUser.socialConnections?.instagram?.accessToken
          ? "exists"
          : "missing",
      });

      // Content is required, but calendarItemId is optional (for direct posts from Social Dashboard)
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Post content is required",
        });
      }

      // Check if user has Instagram connected
      if (!freshUser.socialConnections?.instagram?.accessToken) {
        console.log(
          "[Instagram Share] Instagram not connected for user:",
          freshUser._id
        );
        return res.status(400).json({
          success: false,
          message:
            "Instagram account not connected. Instagram sharing requires a Business or Creator account connected to your Facebook Page. Please connect your Instagram Business/Creator account first.",
          requiresAuth: true,
          helpText:
            "To use Instagram sharing: 1) Switch your Instagram account to Business or Creator in Instagram settings, 2) Connect it to your Facebook Page, 3) Reconnect in this app.",
        });
      }

      const instagram = freshUser.socialConnections.instagram;

      // Check if token is expired
      if (instagram.expiresAt && new Date() > instagram.expiresAt) {
        return res.status(401).json({
          success: false,
          message:
            "Instagram access token expired. Please reconnect your account.",
          requiresAuth: true,
        });
      }

      // Instagram requires an image or video for posts
      // Handle file uploads first (if files were uploaded via FormData)
      let finalImageUrl = imageUrl;
      let finalVideoUrl: string | undefined;

      // If an image file was uploaded, upload to S3 if configured
      if (imageFile) {
        if (isS3Configured()) {
          try {
            // Upload to S3 (Instagram requires publicly accessible URL)
            const fileBuffer = fs.readFileSync(imageFile.path);
            const result = await uploadToS3(
              fileBuffer,
              imageFile.filename,
              imageFile.mimetype,
              'instagram', // Instagram images are stored in instagram folder
              freshUser._id.toString(),
              true // Instagram images need public access
            );
            finalImageUrl = getS3PublicUrl(result.key);
            console.log("[Instagram Share] Image uploaded to S3:", finalImageUrl);
            
            // Delete local temporary file
            fs.unlinkSync(imageFile.path);
          } catch (s3Error) {
            console.error("[Instagram Share] S3 upload failed, using local storage:", s3Error);
            // Fall back to local storage
            const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:5000';
            const relativePath = `/uploads/images/${imageFile.filename}`;
            finalImageUrl = `${backendUrl}${relativePath}`;
            console.log("[Instagram Share] Image file uploaded, converted to URL:", finalImageUrl);
          }
        } else {
          // Use local storage
          const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:5000';
          const relativePath = `/uploads/images/${imageFile.filename}`;
          finalImageUrl = `${backendUrl}${relativePath}`;
          console.log("[Instagram Share] Image file uploaded, converted to URL:", finalImageUrl);
        }
      }
      
      // If a video file was uploaded, upload to S3 if configured
      if (videoFile) {
        if (isS3Configured()) {
          try {
            // Upload to S3 (Instagram requires publicly accessible URL)
            const fileBuffer = fs.readFileSync(videoFile.path);
            const result = await uploadToS3(
              fileBuffer,
              videoFile.filename,
              videoFile.mimetype,
              'instagram', // Instagram videos are stored in instagram folder
              freshUser._id.toString(),
              true // Instagram videos need public access
            );
            finalVideoUrl = getS3PublicUrl(result.key);
            console.log("[Instagram Share] Video uploaded to S3:", finalVideoUrl);
            
            // Delete local temporary file
            fs.unlinkSync(videoFile.path);
          } catch (s3Error) {
            console.error("[Instagram Share] S3 upload failed, using local storage:", s3Error);
            // Fall back to local storage
            const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:5000';
            const relativePath = `/uploads/images/${videoFile.filename}`;
            finalVideoUrl = `${backendUrl}${relativePath}`;
            console.log("[Instagram Share] Video file uploaded, converted to URL:", finalVideoUrl);
          }
        } else {
          // Use local storage
          const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:5000';
          const relativePath = `/uploads/images/${videoFile.filename}`;
          finalVideoUrl = `${backendUrl}${relativePath}`;
          console.log("[Instagram Share] Video file uploaded, converted to URL:", finalVideoUrl);
        }
      }

      // Convert relative URLs to absolute URLs using BACKEND_URL
      // Instagram API requires publicly accessible URLs
      if (finalImageUrl) {
        // Check if it's a relative URL (starts with / or ./)
        if (finalImageUrl.startsWith('/') || finalImageUrl.startsWith('./')) {
          const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:5000';
          // Remove leading slash if present, then append
          const cleanPath = finalImageUrl.replace(/^\.?\//, '');
          finalImageUrl = `${backendUrl}/${cleanPath}`;
          console.log("[Instagram Share] Converted relative URL to absolute:", finalImageUrl);
        }
        // Check if it's already a full URL but localhost (in production, this won't work)
        else if (finalImageUrl.startsWith('http://localhost') || finalImageUrl.startsWith('https://localhost')) {
          if (process.env.NODE_ENV === 'production') {
            return res.status(400).json({
              success: false,
              message: "Instagram API cannot access localhost URLs in production. Please use a publicly accessible image URL.",
              imageUrl: finalImageUrl,
            });
          }
          // In development, try to replace localhost with BACKEND_URL
          const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
          if (backendUrl !== 'http://localhost:5000') {
            const urlObj = new URL(finalImageUrl);
            finalImageUrl = finalImageUrl.replace(urlObj.origin, backendUrl);
            console.log("[Instagram Share] Replaced localhost with BACKEND_URL:", finalImageUrl);
          }
        }
      }
      
      // If no image or video provided, try to generate one from text
      if (!finalImageUrl && !finalVideoUrl) {
        // Try to generate an image from the text content using image generation service
        try {
          const { generateImage } = await import('../services/imageGenerationService.js');
          const { saveImage } = await import('../utils/imageStorage.js');
          
          console.log("[Instagram Share] No image provided, generating text image...");
          
          // Create a prompt for generating a text-based image
          // Limit content length for image generation prompt
          const textContent = content.length > 500 ? content.substring(0, 500) + '...' : content;
          const imagePrompt = `Create a clean, modern social media post image with the following text prominently displayed: "${textContent}". Use a professional design with good contrast and readability.`;
          
          // Generate image
          const generatedImageDataUrl = await generateImage(imagePrompt);
          
          // Extract base64 data and mime type
          const base64Match = generatedImageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (base64Match) {
            const [, mimeType, base64Data] = base64Match;
            // Save the generated image (upload to S3, Instagram requires public access)
            const savedImagePath = await saveImage(
              base64Data,
              mimeType,
              freshUser._id.toString(),
              'instagram',
              true // Instagram images need public access
            );
            
            // If returned URL is S3 URL, use it directly; otherwise convert to full URL
            if (savedImagePath.startsWith('http')) {
              finalImageUrl = savedImagePath;
            } else {
              const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:5000';
              finalImageUrl = `${backendUrl}${savedImagePath}`;
            }
            console.log("[Instagram Share] Generated and saved text image:", finalImageUrl);
          } else {
            throw new Error("Failed to parse generated image data");
          }
        } catch (generateError: any) {
          console.error("[Instagram Share] Failed to generate image from text:", generateError);
          // If image generation fails, return a helpful error message
          return res.status(400).json({
            success: false,
            message:
              "Image URL is required for Instagram posts. Instagram API only supports image or video posts, not text-only posts. Please provide an image, or the system will attempt to generate one from your text (image generation failed).",
            error: generateError.message,
          });
        }
      }

      // Final validation: we need either image or video
      // For now, only support image (video support requires additional API changes)
      if (!finalImageUrl && !finalVideoUrl) {
        return res.status(400).json({
          success: false,
          message:
            "Image or Video is required for Instagram posts. Instagram API only supports image or video posts, not text-only posts. Please provide an image/video.",
        });
      }

      // Final check for publicly accessible URL
      const mediaUrl = finalVideoUrl || finalImageUrl;
      if (!mediaUrl || (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://'))) {
        console.error("[Instagram Share] Final media URL is not a valid public HTTP/HTTPS URL:", mediaUrl);
        return res.status(400).json({
          success: false,
          message: "Generated media URL is not publicly accessible. Instagram API requires a public HTTP/HTTPS URL for images/videos. Consider using ngrok for local testing or cloud storage for deployment.",
          imageUrl: mediaUrl,
        });
      }

      // Share to Instagram (currently only supports image, video support requires API changes)
      // TODO: Add video support to shareToInstagram function
      if (finalVideoUrl && !finalImageUrl) {
        return res.status(400).json({
          success: false,
          message: "Video posts are not yet supported. Please use an image instead.",
        });
      }

      const result = await shareToInstagram(
        instagram.userId!,
        instagram.accessToken,
        {
          text: content,
          imageUrl: finalImageUrl!,
        }
      );

      res.json({
        success: true,
        message: "Successfully shared to Instagram",
        postId: result.postId,
        permalink: result.permalink,
      });
    } catch (error: any) {
      console.error("Instagram share error:", error);

      // Check if it's the image URL requirement error
      if (error.message && error.message.includes("Image URL is required")) {
        return res.status(400).json({
          success: false,
          message:
            "Image URL is required for Instagram posts. Instagram API only supports image or video posts, not text-only posts.",
        });
      }

      // Check if it's an authentication error
      if (
        error.response?.status === 401 ||
        error.response?.data?.error?.code === 190
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Instagram access token expired or invalid. Please reconnect your account.",
          requiresAuth: true,
        });
      }

      res.status(500).json({
        success: false,
        message:
          error.response?.data?.error?.message ||
          error.message ||
          "Failed to share to Instagram",
      });
    }
  }
);

/**
 * @desc    Get user's Facebook Pages list with Instagram info (for selection)
 * @route   GET /api/instagram/pages
 * @access  Private
 */
router.get("/pages", protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { token_key } = req.query;

    if (!token_key) {
      return res.status(400).json({
        success: false,
        message: "Token key is required. Please complete OAuth flow first.",
      });
    }

    // Get temporary token
    const tempTokenData = oauthStates.get(token_key as string);
    if (!tempTokenData) {
      return res.status(400).json({
        success: false,
        message: "Token expired or invalid. Please reconnect your account.",
      });
    }

    const { accessToken } = JSON.parse(tempTokenData);

    // Get Facebook Pages with Instagram info
    const pages = await getFacebookPagesWithInstagram(accessToken);

    res.json({
      success: true,
      pages,
      tokenKey: token_key, // Return token key for later use
    });
  } catch (error: any) {
    console.error("Error getting Facebook pages:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get Facebook pages",
    });
  }
});

/**
 * @desc    Connect selected Facebook Page and Instagram Account
 * @route   POST /api/instagram/connect-page
 * @access  Private
 */
router.post(
  "/connect-page",
  protect,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const { pageId, tokenKey } = req.body;

      if (!pageId || !tokenKey) {
        return res.status(400).json({
          success: false,
          message: "pageId and tokenKey are required",
        });
      }

      // Get temporary token
      const tempTokenData = oauthStates.get(tokenKey);
      if (!tempTokenData) {
        return res.status(400).json({
          success: false,
          message: "Token expired or invalid. Please reconnect your account.",
        });
      }

      const { accessToken, expiresIn } = JSON.parse(tempTokenData);

      // Get Instagram account for selected page
      const instagramAccount = await getInstagramAccountIdForPage(
        pageId,
        accessToken
      );

      // Get Page access token for posting
      let pageAccessToken = accessToken;
      try {
        const pagesResponse = await axios.get<{
          data?: Array<{
            id: string;
            access_token?: string;
          }>;
        }>(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
        );
        if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
          const targetPage = pagesResponse.data.data.find(
            (page) => page.id === pageId
          );
          if (targetPage && targetPage.access_token) {
            pageAccessToken = targetPage.access_token;
            console.log("[Instagram Connect Page] Using Page access token for posting");
          }
        }
      } catch (error) {
        console.error("[Instagram Connect Page] Error getting Page access token:", error);
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      // Save to user
      if (!user.socialConnections) {
        user.socialConnections = {};
      }

      // Save Instagram connection
      user.socialConnections.instagram = {
        accessToken: accessToken,
        userId: instagramAccount.instagramAccountId,
        username: instagramAccount.username,
        accountType: instagramAccount.accountType,
        expiresAt,
      };

      // Also save Facebook Page connection
      user.socialConnections.facebook = {
        accessToken: pageAccessToken,
        userId: instagramAccount.facebookPageId,
        expiresAt,
      };

      await user.save();

      // Verify data was saved correctly
      const savedUser = await User.findById(user._id);

      // Clean up temporary token
      oauthStates.delete(tokenKey);

      console.log("[Instagram OAuth] Successfully saved connections:", {
        userId: user._id,
        instagramUserId: user.socialConnections.instagram?.userId,
        instagramUsername: user.socialConnections.instagram?.username,
        facebookPageId: user.socialConnections.facebook?.userId,
        expiresAt: expiresAt.toISOString(),
        savedInstagramUserId: savedUser?.socialConnections?.instagram?.userId,
        savedInstagramUsername: savedUser?.socialConnections?.instagram?.username,
        savedInstagramAccessToken: savedUser?.socialConnections?.instagram?.accessToken ? "exists" : "missing",
      });

      // Return JSON with redirect URL for frontend to handle
      const clientUrl =
        process.env.CLIENT_URL ||
        process.env.FRONTEND_URL ||
        "http://localhost:3000";
      res.json({
        success: true,
        message: "Successfully connected Instagram and Facebook Page",
        redirectUrl: `${clientUrl}/socialdashboard?facebook=connected&instagram=connected`,
        instagram: {
          userId: instagramAccount.instagramAccountId,
          username: instagramAccount.username,
          accountType: instagramAccount.accountType,
        },
        facebook: {
          pageId: instagramAccount.facebookPageId,
          pageName: instagramAccount.facebookPageName,
        },
      });
    } catch (error: any) {
      console.error("Error connecting page:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to connect page",
      });
    }
  }
);

/**
 * @desc    Get Instagram connection status
 * @route   GET /api/instagram/status
 * @access  Private
 */
router.get(
  "/status",
  protect,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // IMPORTANT: Reload user from database to get latest socialConnections
      const freshUser = await User.findById(user._id);
      if (!freshUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const instagram = freshUser.socialConnections?.instagram;

      // Debug logging to help diagnose connection issues
      console.log("[Instagram Status] Checking connection for user:", user._id);
      console.log("[Instagram Status] Instagram data:", {
        hasInstagram: !!instagram,
        hasAccessToken: !!instagram?.accessToken,
        hasUserId: !!instagram?.userId,
        userId: instagram?.userId,
        username: instagram?.username,
        accountType: instagram?.accountType,
      });

      // Check Instagram connection
      if (
        !instagram ||
        !instagram.accessToken ||
        !instagram.userId
      ) {
        console.log("[Instagram Status] Instagram not connected - missing required fields");
        return res.json({
          success: true,
          connected: false,
        });
      }

      // Check if token is expired
      const isExpired = instagram.expiresAt && new Date() > instagram.expiresAt;

      if (isExpired) {
        return res.json({
          success: true,
          connected: false,
          message:
            "Instagram token has expired. Please reconnect your account.",
        });
      }

      // Get Instagram user profile information (account_type field is not always available)
      let profile = null;
      try {
        // Only request username field, account_type may not be available
        const profileResponse = await axios.get<{
          username?: string;
        }>(
          `https://graph.facebook.com/v18.0/${instagram.userId}?fields=username&access_token=${instagram.accessToken}`
        );

        profile = {
          id: instagram.userId,
          username: profileResponse.data.username || instagram.username,
          name: profileResponse.data.username || instagram.username,
          email: freshUser.email || null, // Use user's email from database (Instagram API doesn't provide email)
          picture: null,
          accountType: instagram.accountType || 'BUSINESS', // Use stored accountType or default
        };
      } catch (profileError: any) {
        console.warn(
          "[Instagram Status] Failed to get user profile:",
          profileError.response?.data || profileError.message
        );
        // Still return connected status even if we can't get profile
        profile = {
          id: instagram.userId,
          username: instagram.username,
          name: instagram.username || "Instagram Account",
          email: freshUser.email || null, // Use user's email from database
          picture: null,
          accountType: instagram.accountType || 'BUSINESS',
        };
      }

      res.json({
        success: true,
        connected: true,
        username: instagram.username,
        accountType: instagram.accountType,
        expiresAt: instagram.expiresAt,
        profile: profile,
      });
    } catch (error: any) {
      console.error("Instagram status error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get Instagram status",
      });
    }
  }
);

/**
 * @desc    Disconnect Instagram account
 * @route   DELETE /api/instagram/disconnect
 * @access  Private
 */
router.delete(
  "/disconnect",
  protect,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // IMPORTANT: Reload user from database to get latest socialConnections
      const freshUser = await User.findById(user._id);
      if (!freshUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Remove Instagram connection
      // IMPORTANT: Use $unset to properly remove nested object in Mongoose
      if (freshUser.socialConnections?.instagram) {
        console.log("[Instagram Disconnect] Removing Instagram connection:", {
          userId: freshUser._id.toString(),
          instagramUserId: freshUser.socialConnections.instagram.userId,
          hasAccessToken: !!freshUser.socialConnections.instagram.accessToken,
        });

        // Use $unset to properly remove nested field in MongoDB
        await User.updateOne(
          { _id: user._id },
          { $unset: { "socialConnections.instagram": "" } }
        );
        console.log("[Instagram Disconnect] User updated using $unset");

        // Verify Instagram was removed
        const verifyUser = await User.findById(user._id);
        if (verifyUser?.socialConnections?.instagram) {
          console.error(
            "[Instagram Disconnect] WARNING: Instagram connection still exists after $unset!"
          );
          // Try direct delete as fallback
          delete verifyUser.socialConnections.instagram;
          await verifyUser.save();
        } else {
          console.log(
            "[Instagram Disconnect] Verified: Instagram connection successfully removed"
          );
        }

        console.log(
          `[Instagram Disconnect] Disconnected Instagram for user ${user._id}`
        );
        return res.json({
          success: true,
          message: "Instagram account disconnected successfully",
        });
      }

      return res.json({
        success: true,
        message: "No Instagram account was connected",
      });
    } catch (error: any) {
      console.error("[Instagram Disconnect] Error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to disconnect Instagram account",
        });
    }
  }
);

export default router;

