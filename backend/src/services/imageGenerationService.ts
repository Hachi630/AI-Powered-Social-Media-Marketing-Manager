import { GoogleGenAI } from '@google/genai'

// Initialize Gemini client with API key from environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

/**
 * Generate an image using Gemini API
 * @param prompt Text prompt for image generation
 * @returns Base64 encoded image data URL (data:mimeType;base64,data)
 */
export async function generateImage(prompt: string): Promise<string> {
  try {
    // Use a model that supports image generation
    // Using gemini-3-pro-image-preview
    const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'

    console.log('Generating image with prompt:', prompt)
    console.log('Using model:', model)

    // Call Gemini API with image generation request.
    // The @google/genai SDK uses `config` (not `generationConfig`) as the field
    // for response modalities since v1. We try a few shapes for backward compat.
    let response: any
    const attempts: Array<{ label: string; payload: any }> = [
      {
        label: 'config.responseModalities=[IMAGE,TEXT]',
        payload: {
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseModalities: ['IMAGE', 'TEXT'] },
        },
      },
      {
        label: 'config.responseModalities=[Image]',
        payload: {
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseModalities: ['Image'] },
        },
      },
      {
        label: 'generationConfig.responseModalities=[IMAGE]',
        payload: {
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        },
      },
    ]

    let lastError: any = null
    for (const attempt of attempts) {
      try {
        console.log(`[ImageGen] Trying ${attempt.label}`)
        response = await ai.models.generateContent(attempt.payload as any)
        if (response) {
          console.log(`[ImageGen] Got response via ${attempt.label}`)
          break
        }
      } catch (apiError: any) {
        lastError = apiError
        console.warn(`[ImageGen] ${attempt.label} failed:`, apiError?.message || apiError)
      }
    }

    if (!response) {
      throw new Error(`Gemini image API call failed: ${lastError?.message || 'all attempts failed'}`)
    }

    // Extract image from response
    const responseAny = response as any

    // Log full response for debugging (but limit size to avoid huge logs)
    const responseStr = JSON.stringify(responseAny, null, 2)
    console.log('API Response structure (first 2000 chars):', responseStr.substring(0, 2000))

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

    // Method 4: Try accessing response directly (some SDKs may wrap it differently)
    if (!imageData && responseAny.response) {
      const nestedResponse = responseAny.response
      if (nestedResponse.candidates && Array.isArray(nestedResponse.candidates) && nestedResponse.candidates.length > 0) {
        const candidate = nestedResponse.candidates[0]
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              imageData = part.inlineData.data
              mimeType = part.inlineData.mimeType || 'image/png'
              console.log('Found image in response.response.candidates[0].content.parts')
              break
            }
          }
        }
      }
    }

    if (!imageData) {
      // If no image found, provide more helpful error message
      const errorDetails: string[] = []
      if (responseAny.candidates && responseAny.candidates.length > 0) {
        const candidate = responseAny.candidates[0]
        if (candidate.finishReason) {
          errorDetails.push(`Finish reason: ${candidate.finishReason}`)
        }
        if (candidate.safetyRatings) {
          errorDetails.push(`Safety ratings: ${JSON.stringify(candidate.safetyRatings)}`)
        }
        if (candidate.content && candidate.content.parts) {
          const partTypes = candidate.content.parts.map((p: any) => Object.keys(p)[0]).join(', ')
          errorDetails.push(`Part types found: ${partTypes}`)
        }
      }
      
      console.error('No image data found in response.')
      console.error('Response keys:', Object.keys(responseAny))
      if (errorDetails.length > 0) {
        console.error('Error details:', errorDetails.join('; '))
      }
      console.error('Full response (first 5000 chars):', responseStr.substring(0, 5000))
      
      throw new Error(
        `Image generation failed: No image data in API response. ` +
        `The model "${model}" may not support image generation, or the API response structure has changed. ` +
        `Please check the backend console for the full response structure. ` +
        (errorDetails.length > 0 ? `Details: ${errorDetails.join('; ')}` : '')
      )
    }

    // Return as data URL
    return `data:${mimeType};base64,${imageData}`
  } catch (error: any) {
    console.error('Image generation error:', error)
    throw new Error(`Image generation failed: ${error.message || 'Unknown error'}`)
  }
}

