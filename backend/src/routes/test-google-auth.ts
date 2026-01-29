/**
 * Test endpoint to verify Google OAuth profile picture retrieval
 * This is a temporary debugging file - can be removed after verification
 */
import express from 'express';
import { verifyGoogleToken } from '../utils/googleAuth';

const router = express.Router();

router.post('/test-google-picture', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    console.log('[Test] Verifying Google token...');
    const googleUser = await verifyGoogleToken(idToken);
    
    return res.status(200).json({
      success: true,
      message: 'Google profile data retrieved successfully',
      data: {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        hasPicture: !!googleUser.picture,
        pictureUrl: googleUser.picture ? googleUser.picture.substring(0, 100) + '...' : null,
        sub: googleUser.sub,
        given_name: googleUser.given_name,
        family_name: googleUser.family_name,
        email_verified: googleUser.email_verified
      }
    });
  } catch (error: any) {
    console.error('[Test] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify token',
      error: error.stack
    });
  }
});

export default router;
