import { GoogleGenAI } from '@google/genai'

// Initialize Gemini client with API key from environment
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }
  return new GoogleGenAI({ apiKey })
}

/**
 * Generate an image using Gemini API
 * @param prompt Text prompt for image generation
 * @returns Base64 encoded image data URL (data:mimeType;base64,data)
 */
export async function generateImage(prompt: string, retries = 2): Promise<string> {
  const startTime = Date.now()
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'

  console.log('[Image Generation] Starting image generation', {
    model,
    promptLength: prompt.length,
    timestamp: new Date().toISOString(),
  })

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Validate API key
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is not set')
      }

      const ai = getAIClient()

      console.log('[Image Generation] Calling API', {
        model,
        attempt: attempt + 1,
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      })

      // Call Gemini API with image generation request
      let response: any
      
      try {
        // Method 1: Try getGenerativeModel approach
        const generativeModel = ai.getGenerativeModel({ model })
        const result = await generativeModel.generateContent({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE'],
          },
        })
        response = result.response
      } catch (method1Error: any) {
        console.warn('[Image Generation] Method 1 failed, trying alternative', {
          error: method1Error.message,
        })
        
        // Method 2: Try direct models.generateContent
        const result = await (ai as any).models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE'],
          },
        })
        response = result
      }

      // Extract image from response
      const responseAny = response as any

      // Log response structure for debugging (only on first attempt or error)
      if (attempt === 0) {
        console.log('[Image Generation] API Response received', {
          hasCandidates: !!responseAny.candidates,
          hasParts: !!responseAny.parts,
          hasText: !!responseAny.text,
        })
      }

    // Check different possible response structures
    let imageData: string | null = null
    let mimeType = 'image/png'

    // Method 1: Try response.candidates[0].content.parts[].inlineData
    if (
      responseAny.candidates &&
      Array.isArray(responseAny.candidates) &&
      responseAny.candidates.length > 0
    ) {
      const candidate = responseAny.candidates[0]
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            imageData = part.inlineData.data
            mimeType = part.inlineData.mimeType || 'image/png'
            console.log('Found image in candidates[0].content.parts')
            break
          }
        }
      }
    }

    // Method 2: Try response.parts[].inlineData
    if (!imageData && responseAny.parts && Array.isArray(responseAny.parts)) {
      for (const part of responseAny.parts) {
        if (part.inlineData && part.inlineData.data) {
          imageData = part.inlineData.data
          mimeType = part.inlineData.mimeType || 'image/png'
          console.log('Found image in response.parts')
          break
        }
      }
    }

    // Method 3: Try response.text (if API returns base64 as text)
    if (!imageData && responseAny.text) {
      // Check if text is base64 encoded image
      const text = responseAny.text.trim()
      if (text.startsWith('data:image/') || /^[A-Za-z0-9+/=]+$/.test(text)) {
        // If it's a data URL, extract base64 part
        if (text.startsWith('data:image/')) {
          const parts = text.split(',')
          if (parts.length === 2) {
            imageData = parts[1]
            const mimeMatch = parts[0].match(/data:([^;]+)/)
            mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
            console.log('Found image in response.text (data URL)')
          }
        } else {
          // Assume it's base64 without data URL prefix
          imageData = text
          console.log('Found image in response.text (base64)')
        }
      }
    }

      if (!imageData) {
        // If no image found, log the response structure for debugging
        console.error('[Image Generation] No image data found in response', {
          attempt: attempt + 1,
          responseStructure: JSON.stringify(responseAny, null, 2),
        })
        throw new Error('Image generation failed: No image data in API response. Please check the console for the full response structure.')
      }

      const duration = Date.now() - startTime
      console.log('[Image Generation] Image generated successfully', {
        model,
        mimeType,
        imageDataLength: imageData.length,
        duration: `${duration}ms`,
        attempt: attempt + 1,
      })

      // Return as data URL
      return `data:${mimeType};base64,${imageData}`
    } catch (error: any) {
      const isLastAttempt = attempt === retries
      const errorMessage = error.message || 'Unknown error'
      const errorCode = error.code || error.status || 'UNKNOWN'

      console.error('[Image Generation] Error generating image', {
        attempt: attempt + 1,
        maxAttempts: retries + 1,
        error: errorMessage,
        errorCode,
        isLastAttempt,
        stack: error.stack,
      })

      // Retry logic for transient errors
      if (!isLastAttempt) {
        const isRetryableError =
          errorCode === 'ECONNRESET' ||
          errorCode === 'ETIMEDOUT' ||
          errorCode === 429 || // Rate limit
          errorCode === 503 || // Service unavailable
          errorMessage.includes('timeout') ||
          errorMessage.includes('network') ||
          errorMessage.includes('ECONNREFUSED')

        if (isRetryableError) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000) // Exponential backoff, max 5s
          console.log(`[Image Generation] Retrying after ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }

      // Throw enhanced error with context
      const enhancedError = new Error(
        `Image generation failed (attempt ${attempt + 1}/${retries + 1}): ${errorMessage}`
      ) as Error & { code?: string | number; originalError?: any }
      enhancedError.code = errorCode
      enhancedError.originalError = error
      throw enhancedError
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Failed to generate image after all retry attempts')
}

