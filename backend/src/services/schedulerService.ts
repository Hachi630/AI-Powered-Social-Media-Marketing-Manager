import dayjs from 'dayjs';
import CalendarItem from '../models/CalendarItem.js';
import LinkedInToken from '../models/LinkedInToken.js';
import TwitterToken from '../models/TwitterToken.js';
import User from '../models/User.js';
import {
  createLinkedInPost,
  createLinkedInPostWithImage,
  initializeImageUpload,
  uploadImageToLinkedIn,
} from './linkedinService.js';
import { twitterService } from './twitterService.js';
import { shareToFacebook } from './facebookService.js';
import { readImageAsBase64 } from '../utils/imageReader.js';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Download image from URL and return as buffer
 */
async function downloadImageFromUrl(imageUrl: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
    });
    
    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'] || 'image/jpeg';
    
    return { buffer, contentType };
  } catch (error: any) {
    console.error('Failed to download image from URL:', imageUrl, error.message);
    return null;
  }
}

/**
 * Get image buffer from imageUrl (handles both local paths and URLs)
 */
async function getImageBuffer(imageUrl: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  // Check if it's a URL (starts with http:// or https://)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return await downloadImageFromUrl(imageUrl);
  }
  
  // Otherwise, treat it as a local file path
  const imageData = readImageAsBase64(imageUrl);
  if (!imageData.success || !imageData.base64) {
    console.error('Failed to read local image:', imageData.error);
    return null;
  }
  
  const buffer = Buffer.from(imageData.base64, 'base64');
  return { buffer, contentType: imageData.mimeType };
}

/**
 * Check and publish scheduled calendar items (LinkedIn, Twitter, and Facebook)
 */
export async function checkAndPublishScheduledItems(): Promise<void> {
  try {
    const now = dayjs();
    console.log(`[Scheduler] ========================================`);
    console.log(`[Scheduler] Checking for scheduled posts at ${now.format('YYYY-MM-DD HH:mm:ss')}...`);
    console.log(`[Scheduler] Current timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    
    // Query for ALL scheduled items (LinkedIn, Twitter, and Facebook, no date filter to avoid timezone issues)
    // We'll filter by date and time in code
    const scheduledItems = await CalendarItem.find({
      status: 'scheduled',
      platform: { $in: ['linkedin', 'twitter', 'facebook'] },
    }).lean();
    
    if (scheduledItems.length === 0) {
      console.log('[Scheduler] No scheduled items found in database');
      console.log(`[Scheduler] ========================================`);
      return;
    }
    
    console.log(`[Scheduler] Found ${scheduledItems.length} scheduled item(s) in database`);
    
    // Log all items for debugging
    scheduledItems.forEach((item) => {
      console.log(`[Scheduler] Item ${item._id}:`, {
        userId: item.userId,
        date: item.date,
        time: item.time || 'no time',
        title: item.title?.substring(0, 30),
        status: item.status,
        platform: item.platform,
      });
    });
    
    // Filter items where the scheduled time has passed
    const itemsToPublish = scheduledItems.filter((item) => {
      // Get the date part in local timezone
      const itemDate = dayjs(item.date);
      const itemDateStr = itemDate.format('YYYY-MM-DD');
      const todayStr = now.format('YYYY-MM-DD');
      
      if (!item.time) {
        // If no time specified, check if date has passed (publish at start of day)
        const itemDateOnly = dayjs(itemDateStr).startOf('day');
        const todayOnly = now.startOf('day');
        const shouldPublish = itemDateOnly.isBefore(todayOnly) || itemDateOnly.isSame(todayOnly);
        
        console.log(`[Scheduler] Item ${item._id} (no time):`, {
          itemDate: itemDateStr,
          today: todayStr,
          itemDateOnly: itemDateOnly.format('YYYY-MM-DD HH:mm:ss'),
          todayOnly: todayOnly.format('YYYY-MM-DD HH:mm:ss'),
          shouldPublish,
        });
        
        return shouldPublish;
      }
      
      // Combine date and time - use local timezone
      // Parse the date string and time string in local timezone
      const scheduledDateTime = dayjs(`${itemDateStr} ${item.time}`, 'YYYY-MM-DD HH:mm', true);
      
      if (!scheduledDateTime.isValid()) {
        console.error(`[Scheduler] Item ${item._id} has invalid date/time: date=${itemDateStr}, time=${item.time}`);
        return false;
      }
      
      // Check if scheduled time has passed
      // Allow publishing if scheduled time is before or equal to current time (within the same minute)
      const shouldPublish = scheduledDateTime.isBefore(now) || scheduledDateTime.isSame(now, 'minute');
      
      console.log(`[Scheduler] Item ${item._id} time check:`, {
        itemDate: itemDateStr,
        itemTime: item.time,
        scheduledDateTime: scheduledDateTime.format('YYYY-MM-DD HH:mm:ss'),
        currentTime: now.format('YYYY-MM-DD HH:mm:ss'),
        isBefore: scheduledDateTime.isBefore(now),
        isSameMinute: scheduledDateTime.isSame(now, 'minute'),
        shouldPublish,
      });
      
      return shouldPublish;
    });
    
    if (itemsToPublish.length === 0) {
      console.log('[Scheduler] No items ready to publish yet (all items are scheduled for future)');
      console.log(`[Scheduler] ========================================`);
      return;
    }
    
    console.log(`[Scheduler] Found ${itemsToPublish.length} item(s) ready to publish`);
    
    // Process each item
    for (const item of itemsToPublish) {
      try {
        if (item.platform === 'linkedin') {
          await publishLinkedInItem(item);
        } else if (item.platform === 'twitter') {
          await publishTwitterItem(item);
        } else if (item.platform === 'facebook') {
          await publishFacebookItem(item);
        } else {
          console.warn(`[Scheduler] Unknown platform for item ${item._id}: ${item.platform}`);
        }
      } catch (error: any) {
        console.error(`[Scheduler] Failed to publish item ${item._id}:`, error.message);
        console.error(`[Scheduler] Error stack:`, error.stack);
        // Keep item as 'scheduled' so it can be retried next time
      }
    }
    
    console.log('[Scheduler] Finished checking scheduled posts');
    console.log(`[Scheduler] ========================================`);
  } catch (error: any) {
    console.error('[Scheduler] Error in checkAndPublishScheduledItems:', error);
    console.error('[Scheduler] Error stack:', error.stack);
    console.log(`[Scheduler] ========================================`);
  }
}

/**
 * Publish a single LinkedIn calendar item
 */
async function publishLinkedInItem(item: any): Promise<void> {
  const itemId = item._id.toString();
  console.log(`[Scheduler] Processing LinkedIn item ${itemId}`);
  console.log(`[Scheduler] Item details:`, {
    id: itemId,
    userId: item.userId,
    platform: item.platform,
    date: item.date,
    time: item.time,
    title: item.title,
    status: item.status,
    hasContent: !!item.content,
    hasLinkedInVariant: !!item.variants?.linkedin,
    hasImage: !!item.imageUrl,
    companyId: item.companyId,
  });
  
  // Get user's LinkedIn token
  const linkedInToken = await LinkedInToken.findOne({ userId: item.userId });
  
  if (!linkedInToken || !linkedInToken.accessToken) {
    console.error(`[Scheduler] LinkedIn account not connected for user ${item.userId}`);
    // Keep item as 'scheduled' - user needs to connect their account
    return;
  }
  
  console.log(`[Scheduler] Found LinkedIn token for user ${item.userId}, memberId: ${linkedInToken.liMemberId}`);
  
  // Check if token is expired
  if (linkedInToken.expiresAt) {
    const expiresAt = dayjs(linkedInToken.expiresAt);
    const isExpired = expiresAt.isBefore(dayjs());
    console.log(`[Scheduler] Token expires at: ${expiresAt.format('YYYY-MM-DD HH:mm:ss')}, expired: ${isExpired}`);
    if (isExpired) {
      console.error(`[Scheduler] LinkedIn token expired for user ${item.userId}`);
      // Keep item as 'scheduled' - user needs to reconnect their account
      return;
    }
  } else {
    console.log(`[Scheduler] Token has no expiration date`);
  }
  
  if (!linkedInToken.liMemberId) {
    console.error(`[Scheduler] LinkedIn member ID not found for user ${item.userId}`);
    return;
  }
  
  // Determine content to post (prefer variant, fallback to content)
  const content = item.variants?.linkedin || item.content;
  
  if (!content || content.trim().length === 0) {
    console.error(`[Scheduler] No content found for item ${itemId}`);
    // Update status to published to prevent retrying empty content
    await CalendarItem.findByIdAndUpdate(itemId, { status: 'published' });
    return;
  }
  
  // Check if posting to organization or personal
  // Validate companyId - it should be a numeric string (LinkedIn organization ID)
  // If companyId exists but is invalid, fall back to personal account
  let isOrganization = false;
  let authorId = linkedInToken.liMemberId;
  
  if (item.companyId && item.companyId.trim().length > 0) {
    // LinkedIn organization IDs are numeric strings
    // Validate that companyId looks like a valid LinkedIn org ID (numeric)
    const companyIdStr = item.companyId.trim();
    if (/^\d+$/.test(companyIdStr)) {
      isOrganization = true;
      authorId = companyIdStr;
      console.log(`[Scheduler] Posting to organization: ${authorId}`);
    } else {
      console.warn(`[Scheduler] Invalid companyId format: "${companyIdStr}". Expected numeric LinkedIn organization ID. Falling back to personal account.`);
      // Fall back to personal account
      isOrganization = false;
      authorId = linkedInToken.liMemberId;
    }
  } else {
    console.log(`[Scheduler] Posting to personal account: ${authorId}`);
  }
  
  let result;
  
  // Handle image if present
  if (item.imageUrl) {
    console.log(`[Scheduler] Item ${itemId} has image, processing...`);
    
    try {
      // Check if imageUrl is a URL or local path
      if (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://')) {
        // Download image from URL
        const imageData = await getImageBuffer(item.imageUrl);
        
        if (!imageData) {
          console.error(`[Scheduler] Failed to download image for item ${itemId}, posting without image`);
          // Post without image if download fails
          result = await createLinkedInPost(
            linkedInToken.accessToken,
            authorId,
            content,
            isOrganization
          );
        } else {
          // Initialize image upload
          const uploadInit = await initializeImageUpload(
            linkedInToken.accessToken,
            authorId,
            isOrganization
          );
          
          if (!uploadInit.success || !uploadInit.uploadUrl || !uploadInit.imageUrn) {
            // Post without image if upload init fails
            result = await createLinkedInPost(
              linkedInToken.accessToken,
              authorId,
              content,
              isOrganization
            );
          } else {
            // Upload image
            const uploadResult = await uploadImageToLinkedIn(
              uploadInit.uploadUrl,
              imageData.buffer,
              imageData.contentType
            );
            
            if (!uploadResult.success) {
              // Post without image if upload fails
              result = await createLinkedInPost(
                linkedInToken.accessToken,
                authorId,
                content,
                isOrganization
              );
            } else {
              // Post with image
              result = await createLinkedInPostWithImage(
                linkedInToken.accessToken,
                authorId,
                content,
                uploadInit.imageUrn,
                isOrganization
              );
            }
          }
        }
      } else {
        // Local file path - check if file exists
        let filePath = item.imageUrl;
        if (item.imageUrl.startsWith('/uploads')) {
          filePath = path.join(process.cwd(), item.imageUrl);
        }
        
        if (fs.existsSync(filePath)) {
          // Read image as base64
          const imageData = readImageAsBase64(filePath);
          if (!imageData.success || !imageData.base64) {
            console.error(`[Scheduler] Failed to read local image for item ${itemId}, posting without image`);
            // Post without image if read fails
            result = await createLinkedInPost(
              linkedInToken.accessToken,
              authorId,
              content,
              isOrganization
            );
          } else {
            const buffer = Buffer.from(imageData.base64, 'base64');
            
            // Initialize image upload
            const uploadInit = await initializeImageUpload(
              linkedInToken.accessToken,
              authorId,
              isOrganization
            );
            
            if (!uploadInit.success || !uploadInit.uploadUrl || !uploadInit.imageUrn) {
              // Post without image if upload init fails
              result = await createLinkedInPost(
                linkedInToken.accessToken,
                authorId,
                content,
                isOrganization
              );
            } else {
              // Upload image
              const uploadResult = await uploadImageToLinkedIn(
                uploadInit.uploadUrl,
                buffer,
                imageData.mimeType
              );
              
              if (!uploadResult.success) {
                // Post without image if upload fails
                result = await createLinkedInPost(
                  linkedInToken.accessToken,
                  authorId,
                  content,
                  isOrganization
                );
              } else {
                // Post with image
                result = await createLinkedInPostWithImage(
                  linkedInToken.accessToken,
                  authorId,
                  content,
                  uploadInit.imageUrn,
                  isOrganization
                );
              }
            }
          }
        } else {
          console.warn(`[Scheduler] Image file not found at ${filePath}, posting without image`);
          // Post without image if file doesn't exist
          result = await createLinkedInPost(
            linkedInToken.accessToken,
            authorId,
            content,
            isOrganization
          );
        }
      }
    } catch (error: any) {
      console.error(`[Scheduler] Error handling image for item ${itemId}:`, error.message);
      // Post without image if any image-related error occurs
      result = await createLinkedInPost(
        linkedInToken.accessToken,
        authorId,
        content,
        isOrganization
      );
    }
  } else {
    // Post without image
    result = await createLinkedInPost(
      linkedInToken.accessToken,
      authorId,
      content,
      isOrganization
    );
  }
  
  // Update item status based on result
  if (result.success) {
    await CalendarItem.findByIdAndUpdate(itemId, { status: 'published' });
    console.log(`[Scheduler] ✅ Successfully published LinkedIn item ${itemId}, postId: ${result.postId}`);
  } else {
    console.error(`[Scheduler] ❌ Failed to publish LinkedIn item ${itemId}`);
    console.error(`[Scheduler] Error details:`, {
      error: result.error,
      authorId: authorId,
      isOrganization: isOrganization,
      authorUrn: isOrganization ? `urn:li:organization:${authorId}` : `urn:li:person:${authorId}`,
      hasContent: !!content && content.trim().length > 0,
      contentLength: content?.length || 0,
    });
    // Keep status as 'scheduled' for retry
  }
}

/**
 * Publish a single Twitter calendar item
 */
async function publishTwitterItem(item: any): Promise<void> {
  const itemId = item._id.toString();
  console.log(`[Scheduler] Processing Twitter item ${itemId}`);
  console.log(`[Scheduler] Item details:`, {
    id: itemId,
    userId: item.userId,
    platform: item.platform,
    date: item.date,
    time: item.time,
    title: item.title,
    status: item.status,
    hasContent: !!item.content,
    hasTwitterVariant: !!item.variants?.twitter,
    hasImage: !!item.imageUrl,
  });
  
  // Get user's Twitter token
  const twitterToken = await TwitterToken.findOne({ userId: item.userId });
  
  if (!twitterToken || !twitterToken.accessToken || !twitterToken.accessSecret) {
    console.error(`[Scheduler] Twitter account not connected for user ${item.userId}`);
    // Keep item as 'scheduled' - user needs to connect their account
    return;
  }
  
  console.log(`[Scheduler] Found Twitter token for user ${item.userId}, twitterUserId: ${twitterToken.twitterUserId}`);
  
  // Check if token is expired
  if (twitterToken.expiresAt) {
    const expiresAt = dayjs(twitterToken.expiresAt);
    const isExpired = expiresAt.isBefore(dayjs());
    console.log(`[Scheduler] Token expires at: ${expiresAt.format('YYYY-MM-DD HH:mm:ss')}, expired: ${isExpired}`);
    if (isExpired) {
      console.error(`[Scheduler] Twitter token expired for user ${item.userId}`);
      // Keep item as 'scheduled' - user needs to reconnect their account
      return;
    }
  } else {
    console.log(`[Scheduler] Token has no expiration date`);
  }
  
  // Determine content to post (prefer variant, fallback to content)
  let content = item.variants?.twitter || item.content;
  
  if (!content || content.trim().length === 0) {
    console.error(`[Scheduler] No content found for item ${itemId}`);
    // Update status to published to prevent retrying empty content
    await CalendarItem.findByIdAndUpdate(itemId, { status: 'published' });
    return;
  }
  
  // Twitter content length limit is 280 characters
  if (content.length > 280) {
    console.warn(`[Scheduler] Content length (${content.length}) exceeds Twitter limit (280), truncating...`);
    content = content.substring(0, 277) + '...';
  }
  
  let result;
  let tempFilePath: string | null = null;
  
  // Handle image if present
  if (item.imageUrl) {
    console.log(`[Scheduler] Item ${itemId} has image, processing...`);
    
    try {
      // Check if imageUrl is a URL or local path
      if (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://')) {
        // Download image from URL and save to temporary file
        const imageData = await getImageBuffer(item.imageUrl);
        
        if (!imageData) {
          console.error(`[Scheduler] Failed to download image for item ${itemId}, posting without image`);
          // Post without image if download fails
          result = await twitterService.postTweet(
            content,
            null,
            twitterToken.accessToken,
            twitterToken.accessSecret
          );
        } else {
          // Create temporary file
          const tempDir = os.tmpdir();
          const fileExtension = imageData.contentType?.split('/')[1] || 'jpg';
          tempFilePath = path.join(tempDir, `twitter-${itemId}-${Date.now()}.${fileExtension}`);
          
          try {
            fs.writeFileSync(tempFilePath, imageData.buffer);
            console.log(`[Scheduler] Image saved to temporary file: ${tempFilePath}`);
            
            // Post with image
            result = await twitterService.postTweet(
              content,
              tempFilePath,
              twitterToken.accessToken,
              twitterToken.accessSecret
            );
          } catch (writeError: any) {
            console.error(`[Scheduler] Failed to write temporary file for item ${itemId}:`, writeError.message);
            // Post without image if file write fails
            result = await twitterService.postTweet(
              content,
              null,
              twitterToken.accessToken,
              twitterToken.accessSecret
            );
          }
        }
      } else {
        // Local file path - check if file exists
        let filePath = item.imageUrl;
        if (item.imageUrl.startsWith('/uploads')) {
          filePath = path.join(process.cwd(), item.imageUrl);
        }
        
        if (fs.existsSync(filePath)) {
          // Post with image
          result = await twitterService.postTweet(
            content,
            filePath,
            twitterToken.accessToken,
            twitterToken.accessSecret
          );
        } else {
          console.warn(`[Scheduler] Image file not found at ${filePath}, posting without image`);
          // Post without image if file doesn't exist
          result = await twitterService.postTweet(
            content,
            null,
            twitterToken.accessToken,
            twitterToken.accessSecret
          );
        }
      }
    } catch (error: any) {
      console.error(`[Scheduler] Error handling image for item ${itemId}:`, error.message);
      // Post without image if any image-related error occurs
      result = await twitterService.postTweet(
        content,
        null,
        twitterToken.accessToken,
        twitterToken.accessSecret
      );
    } finally {
      // Clean up temporary file if it was created
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          console.log(`[Scheduler] Cleaned up temporary file: ${tempFilePath}`);
        } catch (cleanupError: any) {
          console.error(`[Scheduler] Failed to clean up temporary file ${tempFilePath}:`, cleanupError.message);
        }
      }
    }
  } else {
    // Post without image
    result = await twitterService.postTweet(
      content,
      null,
      twitterToken.accessToken,
      twitterToken.accessSecret
    );
  }
  
  // Update item status based on result
  if (result.success) {
    await CalendarItem.findByIdAndUpdate(itemId, { status: 'published' });
    console.log(`[Scheduler] ✅ Successfully published Twitter item ${itemId}, tweetId: ${result.tweetId}`);
  } else {
    console.error(`[Scheduler] ❌ Failed to publish Twitter item ${itemId}`);
    console.error(`[Scheduler] Error details:`, {
      error: result.error,
      hasContent: !!content && content.trim().length > 0,
      contentLength: content?.length || 0,
    });
    // Keep status as 'scheduled' for retry
  }
}

/**
 * Publish a single Facebook calendar item
 */
async function publishFacebookItem(item: any): Promise<void> {
  const itemId = item._id.toString();
  console.log(`[Scheduler] Processing Facebook item ${itemId}`);
  console.log(`[Scheduler] Item details:`, {
    id: itemId,
    userId: item.userId,
    platform: item.platform,
    date: item.date,
    time: item.time,
    title: item.title,
    status: item.status,
    hasContent: !!item.content,
    hasFacebookVariant: !!item.variants?.facebook,
    hasImage: !!item.imageUrl,
  });
  
  // Get user's Facebook token
  const user = await User.findById(item.userId);
  
  if (!user) {
    console.error(`[Scheduler] User not found for item ${itemId}`);
    // Update status to published to prevent retrying
    await CalendarItem.findByIdAndUpdate(itemId, { status: 'published' });
    return;
  }
  
  const facebook = user.socialConnections?.facebook;
  
  if (!facebook?.accessToken || !facebook?.userId) {
    console.error(`[Scheduler] Facebook account not connected for user ${item.userId}`);
    // Keep item as 'scheduled' - user needs to connect their account
    return;
  }
  
  console.log(`[Scheduler] Found Facebook token for user ${item.userId}, pageId: ${facebook.userId}`);
  
  // Check if token is expired
  if (facebook.expiresAt) {
    const expiresAt = dayjs(facebook.expiresAt);
    const isExpired = expiresAt.isBefore(dayjs());
    console.log(`[Scheduler] Token expires at: ${expiresAt.format('YYYY-MM-DD HH:mm:ss')}, expired: ${isExpired}`);
    if (isExpired) {
      console.error(`[Scheduler] Facebook token expired for user ${item.userId}`);
      // Keep item as 'scheduled' - user needs to reconnect their account
      return;
    }
  } else {
    console.log(`[Scheduler] Token has no expiration date`);
  }
  
  // Determine content to post (prefer variant, fallback to content)
  const content = item.variants?.facebook || item.content;
  
  if (!content || content.trim().length === 0) {
    console.error(`[Scheduler] No content found for item ${itemId}`);
    // Update status to published to prevent retrying empty content
    await CalendarItem.findByIdAndUpdate(itemId, { status: 'published' });
    return;
  }
  
  let result;
  
  try {
    // Share to Facebook using Graph API
    result = await shareToFacebook(facebook.userId, facebook.accessToken, {
      text: content,
      imageUrl: item.imageUrl,
    });
    
    // Update item status based on result
    if (result.postId) {
      await CalendarItem.findByIdAndUpdate(itemId, { status: 'published' });
      console.log(`[Scheduler] ✅ Successfully published Facebook item ${itemId}, postId: ${result.postId}`);
    } else {
      console.error(`[Scheduler] ❌ Failed to publish Facebook item ${itemId}: no postId returned`);
      // Keep status as 'scheduled' for retry
    }
  } catch (error: any) {
    console.error(`[Scheduler] ❌ Failed to publish Facebook item ${itemId}`);
    console.error(`[Scheduler] Error details:`, {
      error: error.message,
      response: error.response?.data,
      hasContent: !!content && content.trim().length > 0,
      contentLength: content?.length || 0,
    });
    // Keep status as 'scheduled' for retry
  }
}