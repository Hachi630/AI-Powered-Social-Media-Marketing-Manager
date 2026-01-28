import { OAuth2Client } from 'google-auth-library'

/**
 * Interface for Google user information from verified token
 */
export interface GoogleUserInfo {
  sub: string // Google user ID
  email: string
  email_verified: boolean
  name?: string
  picture?: string
  given_name?: string
  family_name?: string
}

/**
 * Verify Google ID token and extract user information
 * @param idToken - The ID token received from Google OAuth
 * @returns User information from the verified token
 * @throws Error if token is invalid or verification fails
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('[Google Auth] GOOGLE_CLIENT_ID is not set in environment variables')
      throw new Error('GOOGLE_CLIENT_ID environment variable is not set')
    }

    console.log('[Google Auth] Verifying token with Client ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...')

    // Create a new client instance to ensure fresh configuration
    const verifyClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

    // Verify the token
    const ticket = await verifyClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    // Get the payload (user information)
    const payload = ticket.getPayload()

    if (!payload) {
      console.error('[Google Auth] No payload found in token')
      throw new Error('Invalid token: No payload found')
    }

    console.log('[Google Auth] Token verified successfully')
    console.log('[Google Auth] Full payload received from Google:', {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      picture_url: payload.picture ? payload.picture.substring(0, 100) + '...' : 'NOT PROVIDED',
      has_picture: !!payload.picture,
      sub: payload.sub,
      given_name: payload.given_name,
      family_name: payload.family_name,
      email_verified: payload.email_verified,
      // Log all available keys to see what Google provides
      available_keys: Object.keys(payload).filter(key => 
        ['email', 'name', 'picture', 'sub', 'given_name', 'family_name', 'email_verified'].includes(key)
      )
    })

    // Extract and return user information
    const userInfo: GoogleUserInfo = {
      sub: payload.sub,
      email: payload.email || '',
      email_verified: payload.email_verified || false,
      name: payload.name,
      picture: payload.picture,
      given_name: payload.given_name,
      family_name: payload.family_name,
    }

    console.log('[Google Auth] Extracted user info:', {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture ? userInfo.picture.substring(0, 100) + '...' : 'NOT PROVIDED',
      has_picture: !!userInfo.picture,
      sub: userInfo.sub
    })

    // Validate required fields
    if (!userInfo.email) {
      console.error('[Google Auth] Email not found in token payload')
      throw new Error('Invalid token: Email not found in token')
    }

    return userInfo
  } catch (error: any) {
    console.error('[Google Auth] Token verification error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    
    // Provide more specific error messages
    if (error.message?.includes('Token used too early')) {
      throw new Error('Token is not yet valid')
    }
    if (error.message?.includes('Token used too late')) {
      throw new Error('Token has expired')
    }
    if (error.message?.includes('Invalid token signature')) {
      throw new Error('Invalid token signature')
    }
    if (error.message?.includes('Wrong number of segments')) {
      throw new Error('Invalid token format')
    }
    
    // Provide a more descriptive error message
    const errorDetails = error.message || error.code || 'Unknown error'
    throw new Error(`Google token verification failed: ${errorDetails}`)
  }
}

/**
 * Get Google OAuth client for frontend configuration
 * Returns the client ID that frontend needs
 */
export function getGoogleClientId(): string {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is not set')
  }
  return process.env.GOOGLE_CLIENT_ID
}

