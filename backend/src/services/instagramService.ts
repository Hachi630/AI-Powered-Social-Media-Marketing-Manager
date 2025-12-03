import axios from 'axios'

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:5000/api/social/instagram/callback'

/**
 * Generate Instagram OAuth authorization URL
 */
export function getInstagramAuthUrl(state: string): string {
  if (!FACEBOOK_APP_ID) {
    throw new Error('FACEBOOK_APP_ID is not configured')
  }

  // For Instagram Graph API, we need permissions to access Facebook Pages
  // IMPORTANT: These permissions may need to be requested in Facebook App Dashboard
  // Go to: App Dashboard > App Review > Permissions and Features
  // Request: pages_show_list, pages_read_engagement, pages_manage_posts
  // For development/testing, try with minimal scopes first
  const scopes = [
    'pages_show_list',  // List user's Facebook pages (may require review)
  ].join(',')

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: FACEBOOK_REDIRECT_URI,
    scope: scopes,
    response_type: 'code',
    state,
  })

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string
  tokenType: string
  expiresIn: number
}> {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    throw new Error('Facebook App credentials are not configured')
  }

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    client_secret: FACEBOOK_APP_SECRET,
    redirect_uri: FACEBOOK_REDIRECT_URI,
    code,
  })

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`
    )

    return {
      accessToken: response.data.access_token,
      tokenType: response.data.token_type || 'bearer',
      expiresIn: response.data.expires_in || 5184000, // Default 60 days
    }
  } catch (error: any) {
    console.error('Error exchanging code for token:', error.response?.data || error.message)
    throw new Error(`Failed to exchange code for token: ${error.response?.data?.error?.message || error.message}`)
  }
}

/**
 * Get long-lived access token (valid for 60 days)
 */
export async function getLongLivedToken(shortLivedToken: string): Promise<{
  accessToken: string
  expiresIn: number
}> {
  if (!FACEBOOK_APP_SECRET) {
    throw new Error('FACEBOOK_APP_SECRET is not configured')
  }

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: FACEBOOK_APP_ID!,
    client_secret: FACEBOOK_APP_SECRET,
    fb_exchange_token: shortLivedToken,
  })

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`
    )

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in || 5184000,
    }
  } catch (error: any) {
    console.error('Error getting long-lived token:', error.response?.data || error.message)
    throw new Error(`Failed to get long-lived token: ${error.response?.data?.error?.message || error.message}`)
  }
}

/**
 * Get user's Instagram Business Account ID
 */
export async function getInstagramAccountId(accessToken: string): Promise<{
  instagramAccountId: string
  username: string
  accountType: 'BUSINESS' | 'CREATOR'
}> {
  try {
    // First, get user's Facebook pages
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    )

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      throw new Error('No Facebook pages found. Please connect a Facebook page first.')
    }

    // Get Instagram account for the first page
    const pageId = pagesResponse.data.data[0].id
    const instagramResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
    )

    if (!instagramResponse.data.instagram_business_account) {
      throw new Error('No Instagram Business Account found. Please connect an Instagram Business Account to your Facebook page.')
    }

    const instagramAccountId = instagramResponse.data.instagram_business_account.id

    // Get Instagram account details
    const accountDetailsResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=username,account_type&access_token=${accessToken}`
    )

    return {
      instagramAccountId,
      username: accountDetailsResponse.data.username,
      accountType: accountDetailsResponse.data.account_type === 'BUSINESS' ? 'BUSINESS' : 'CREATOR',
    }
  } catch (error: any) {
    console.error('Error getting Instagram account:', error.response?.data || error.message)
    throw new Error(`Failed to get Instagram account: ${error.response?.data?.error?.message || error.message}`)
  }
}

/**
 * Create an Instagram media container (for image posts)
 */
export async function createMediaContainer(
  instagramAccountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
      {
        image_url: imageUrl,
        caption: caption.substring(0, 2200), // Instagram caption limit
        access_token: accessToken,
      }
    )

    return response.data.id // Returns creation_id
  } catch (error: any) {
    console.error('Error creating media container:', error.response?.data || error.message)
    throw new Error(`Failed to create media container: ${error.response?.data?.error?.message || error.message}`)
  }
}

/**
 * Publish Instagram media container
 */
export async function publishMedia(
  instagramAccountId: string,
  accessToken: string,
  creationId: string
): Promise<{
  id: string
  permalink?: string
}> {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken,
      }
    )

    // Get post permalink
    let permalink: string | undefined
    try {
      const postResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${response.data.id}?fields=permalink&access_token=${accessToken}`
      )
      permalink = postResponse.data.permalink
    } catch (e) {
      // Permalink is optional
    }

    return {
      id: response.data.id,
      permalink,
    }
  } catch (error: any) {
    console.error('Error publishing media:', error.response?.data || error.message)
    throw new Error(`Failed to publish media: ${error.response?.data?.error?.message || error.message}`)
  }
}

/**
 * Share content to Instagram
 */
export async function shareToInstagram(
  instagramAccountId: string,
  accessToken: string,
  content: {
    text: string
    imageUrl?: string
  }
): Promise<{
  postId: string
  permalink?: string
}> {
  if (!content.imageUrl) {
    throw new Error('Image URL is required for Instagram posts')
  }

  // Step 1: Create media container
  const creationId = await createMediaContainer(
    instagramAccountId,
    accessToken,
    content.imageUrl,
    content.text
  )

  // Step 2: Publish the media
  return await publishMedia(instagramAccountId, accessToken, creationId)
}

