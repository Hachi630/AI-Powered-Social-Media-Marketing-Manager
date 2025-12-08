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
  // Based on Facebook Pages API official documentation:
  // https://developers.facebook.com/docs/pages-api/getting-started
  // 
  // Required permissions according to official docs:
  // - pages_manage_metadata: Manage page metadata
  // - pages_manage_posts: Manage page posts (required for publishing)
  // - pages_manage_read_engagement: Read page engagement data (required to list pages)
  // - pages_show_list: List user's pages (may be deprecated but still in official docs)
  // 
  // For Instagram Business Account access, we specifically need:
  // - pages_manage_read_engagement: To get list of pages and access Instagram account
  // - pages_manage_posts: To publish content to Instagram
  // 
  // Using permissions for Pages API and Instagram API
  // These permissions should be automatically configured when you select:
  // - "Manage messaging & content on Instagram" use case
  // - "Manage everything on your Page" use case
  // 
  // If you get "Invalid Scopes" error, check that these use cases are selected
  // in your Facebook App Dashboard > Use Cases
  const scopes = [
    'pages_read_engagement',  // Read page engagement (for getting Pages list)
    'pages_manage_posts',     // Manage page posts (for publishing to Instagram)
    'pages_show_list',        // List user's pages
  ].filter(Boolean).join(',')
  
  // Alternative: If above doesn't work, try minimal set:
  // const scopes = 'pages_read_engagement'
  
  // Fallback: Use empty scope (let Facebook use default permissions)
  // const scopes = ''

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: FACEBOOK_REDIRECT_URI,
    response_type: 'code',
    state,
  })
  
  // Only add scope if we have permissions to request
  // If empty, Facebook will use default permissions for the app
  if (scopes) {
    params.append('scope', scopes)
  }

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
 * Get user's Facebook Pages list
 */
export async function getFacebookPages(accessToken: string): Promise<Array<{
  id: string
  name: string
  category: string
  accessToken: string
  tasks: string[]
  hasInstagramAccount?: boolean
  instagramAccountId?: string
  instagramUsername?: string
}>> {
  try {
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    )

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      return []
    }

    // Check each page for Instagram Business Account
    const pagesWithInstagram = await Promise.all(
      pagesResponse.data.data.map(async (page: any) => {
        try {
          const instagramResponse = await axios.get(
            `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
          )

          if (instagramResponse.data.instagram_business_account) {
            const instagramAccountId = instagramResponse.data.instagram_business_account.id
            // Get Instagram account details
            const accountDetailsResponse = await axios.get(
              `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=username,account_type&access_token=${page.access_token}`
            )

            return {
              id: page.id,
              name: page.name,
              category: page.category || '',
              accessToken: page.access_token,
              tasks: page.tasks || [],
              hasInstagramAccount: true,
              instagramAccountId,
              instagramUsername: accountDetailsResponse.data.username,
            }
          } else {
            return {
              id: page.id,
              name: page.name,
              category: page.category || '',
              accessToken: page.access_token,
              tasks: page.tasks || [],
              hasInstagramAccount: false,
            }
          }
        } catch (error) {
          // If error checking Instagram, still return the page
          return {
            id: page.id,
            name: page.name,
            category: page.category || '',
            accessToken: page.access_token,
            tasks: page.tasks || [],
            hasInstagramAccount: false,
          }
        }
      })
    )

    return pagesWithInstagram
  } catch (error: any) {
    console.error('Error getting Facebook pages:', error.response?.data || error.message)
    throw new Error(`Failed to get Facebook pages: ${error.response?.data?.error?.message || error.message}`)
  }
}

/**
 * Get Instagram Business Account ID for a specific Facebook Page
 */
export async function getInstagramAccountIdForPage(
  pageId: string,
  accessToken: string
): Promise<{
  instagramAccountId: string
  username: string
  accountType: 'BUSINESS' | 'CREATOR'
  facebookPageId: string
  facebookPageName?: string
}> {
  try {
    // Get page details
    const pageResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${pageId}?fields=name,instagram_business_account&access_token=${accessToken}`
    )

    if (!pageResponse.data.instagram_business_account) {
      throw new Error('No Instagram Business Account found. Please connect an Instagram Business Account to your Facebook page.')
    }

    const instagramAccountId = pageResponse.data.instagram_business_account.id

    // Get Instagram account details
    const accountDetailsResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=username,account_type&access_token=${accessToken}`
    )

    return {
      instagramAccountId,
      username: accountDetailsResponse.data.username,
      accountType: accountDetailsResponse.data.account_type === 'BUSINESS' ? 'BUSINESS' : 'CREATOR',
      facebookPageId: pageId,
      facebookPageName: pageResponse.data.name,
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

