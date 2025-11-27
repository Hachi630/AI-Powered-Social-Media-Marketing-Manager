import { GoogleGenAI } from '@google/genai'

// Initialize Gemini client with API key from environment
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }
  return new GoogleGenAI({ apiKey })
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface UserContext {
  brandName?: string
  industry?: string
  toneOfVoice?: string
  knowledgeProducts?: string[]
  targetAudience?: string[]
}

export interface ChatRequest {
  messages: ChatMessage[]
  userContext?: UserContext
}

/**
 * Token limit constants (approximate)
 * Gemini models have different limits, using conservative estimates
 */
const TOKEN_LIMITS = {
  'gemini-2.5-flash': {
    input: 1000000, // 1M tokens
    output: 8192,
  },
  'gemini-2.0-flash-exp': {
    input: 1000000,
    output: 8192,
  },
  default: {
    input: 1000000,
    output: 8192,
  },
}

/**
 * Rough token estimation (1 token ≈ 4 characters for English)
 */
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4)
}

interface GeminiAPIResponse {
  text?: string
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

export const geminiService = {
  /**
   * Generate content using Gemini API with retry logic
   */
  async generateContent(request: ChatRequest, retries = 2): Promise<string> {
    const startTime = Date.now()
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    
    // Log request details
    console.log('[Gemini Service] Starting content generation', {
      model,
      messageCount: request.messages.length,
      hasUserContext: !!request.userContext,
      timestamp: new Date().toISOString(),
    })

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Validate API key
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY environment variable is not set')
        }

        const ai = getAIClient()

        // Build system prompt from user context
        const systemPrompt = this.buildSystemPrompt(request.userContext)

        // Prepare messages for Gemini API
        // Gemini API expects contents array with role and parts
        const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []

        // Add system message if we have context
        if (systemPrompt && systemPrompt !== 'You are a helpful AI assistant.') {
          contents.push({
            role: 'user',
            parts: [{ text: systemPrompt }],
          })
          contents.push({
            role: 'model',
            parts: [{ text: 'I understand. I will act as an AI assistant with the specified brand context.' }],
          })
        }

        // Add conversation history
        for (const msg of request.messages) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            contents.push({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }],
            })
          }
        }

        // Validate contents before API call
        if (contents.length === 0) {
          throw new Error('No valid messages to send to Gemini API')
        }

        // Estimate token count and check limits
        const totalText = contents.map((c) => c.parts.map((p) => p.text).join('')).join(' ')
        const estimatedTokens = estimateTokens(totalText)
        const tokenLimit = TOKEN_LIMITS[model as keyof typeof TOKEN_LIMITS] || TOKEN_LIMITS.default

        if (estimatedTokens > tokenLimit.input) {
          console.warn('[Gemini Service] Token limit warning', {
            model,
            estimatedTokens,
            limit: tokenLimit.input,
            percentage: ((estimatedTokens / tokenLimit.input) * 100).toFixed(2) + '%',
          })
          // Don't throw error, but log warning - API will handle it
        }

        console.log('[Gemini Service] Calling API', {
          model,
          contentCount: contents.length,
          attempt: attempt + 1,
        })

        // Call Gemini API - try different possible API structures
        let response: GeminiAPIResponse
        
        try {
          // Method 1: Try getGenerativeModel approach (most common)
          const generativeModel = ai.getGenerativeModel({ model })
          const result = await generativeModel.generateContent({ contents })
          response = result.response as GeminiAPIResponse
        } catch (method1Error: any) {
          console.warn('[Gemini Service] Method 1 failed, trying alternative', {
            error: method1Error.message,
          })
          
          // Method 2: Try direct models.generateContent
          try {
            const result = await (ai as any).models.generateContent({
              model,
              contents,
            })
            response = result as GeminiAPIResponse
          } catch (method2Error: any) {
            console.warn('[Gemini Service] Method 2 failed, trying alternative', {
              error: method2Error.message,
            })
            
            // Method 3: Try with explicit API key
            const result = await (ai as any).generateContent({
              model,
              contents,
            })
            response = result as GeminiAPIResponse
          }
        }

        // Extract response text with multiple fallback methods
        let responseText: string | null = null

        // Method 1: Direct text property
        if (response.text) {
          responseText = response.text
          console.log('[Gemini Service] Response extracted via response.text')
        }
        // Method 2: candidates[0].content.parts[0].text
        else if (
          response.candidates &&
          Array.isArray(response.candidates) &&
          response.candidates.length > 0 &&
          response.candidates[0].content?.parts &&
          response.candidates[0].content.parts.length > 0 &&
          response.candidates[0].content.parts[0].text
        ) {
          responseText = response.candidates[0].content.parts[0].text
          console.log('[Gemini Service] Response extracted via candidates[0].content.parts[0].text')
        }

        if (!responseText) {
          // Log full response for debugging
          console.error('[Gemini Service] Could not extract text from response', {
            responseStructure: JSON.stringify(response, null, 2),
          })
          throw new Error('Failed to extract text from Gemini API response. Check logs for response structure.')
        }

        const duration = Date.now() - startTime
        console.log('[Gemini Service] Content generated successfully', {
          model,
          responseLength: responseText.length,
          duration: `${duration}ms`,
          attempt: attempt + 1,
        })

        return responseText
      } catch (error: any) {
        const isLastAttempt = attempt === retries
        const errorMessage = error.message || 'Unknown error'
        const errorCode = error.code || error.status || 'UNKNOWN'

        console.error('[Gemini Service] Error generating content', {
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
            console.log(`[Gemini Service] Retrying after ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            continue
          }
        }

        // Throw enhanced error with context
        const enhancedError = new Error(
          `Gemini API error (attempt ${attempt + 1}/${retries + 1}): ${errorMessage}`
        ) as Error & { code?: string | number; originalError?: any }
        enhancedError.code = errorCode
        enhancedError.originalError = error
        throw enhancedError
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Failed to generate content after all retry attempts')
  },

  /**
   * Build system prompt based on user's Brand Profile
   */
  buildSystemPrompt(context?: UserContext): string {
    if (!context) {
      return 'You are a helpful AI assistant.'
    }

    let prompt = 'You are an AI assistant'

    if (context.brandName) {
      prompt += ` for ${context.brandName}`
    } else {
      prompt += ' for a brand'
    }

    if (context.industry) {
      prompt += ` in the ${context.industry} industry`
    }

    prompt += '.'

    if (context.toneOfVoice) {
      const toneDescriptions: Record<string, string> = {
        calm: 'calm, peaceful, and soothing',
        warm: 'warm, friendly, and approachable',
        mindful: 'mindful, thoughtful, and reflective',
      }
      const toneDesc = toneDescriptions[context.toneOfVoice] || context.toneOfVoice
      prompt += ` Your tone of voice should be ${toneDesc}.`
    }

    if (context.knowledgeProducts && context.knowledgeProducts.length > 0) {
      prompt += `\n\nYou have knowledge about these products: ${context.knowledgeProducts.join(', ')}.`
    }

    if (context.targetAudience && context.targetAudience.length > 0) {
      prompt += `\n\nYour target audience includes: ${context.targetAudience.join(', ')}.`
    }

    prompt += '\n\nPlease respond in a helpful and professional manner that aligns with the brand identity.'

    return prompt
  },
}

