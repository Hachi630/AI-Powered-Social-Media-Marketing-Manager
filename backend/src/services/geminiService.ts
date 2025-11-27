import { GoogleGenAI } from '@google/genai'

// Initialize Gemini client (automatically gets API key from GEMINI_API_KEY env var)
const ai = new GoogleGenAI({})

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

export const geminiService = {
  /**
   * Generate content using Gemini API
   */
  async generateContent(request: ChatRequest): Promise<string> {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

      // Build system prompt from user context
      const systemPrompt = this.buildSystemPrompt(request.userContext)

      // Prepare messages for Gemini API
      // Gemini API expects contents array with role and parts
      const contents = []

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

      // Call Gemini API
      const response = await ai.models.generateContent({
        model,
        contents,
      })

      // Extract response text
      // According to Gemini API docs, response.text is available
      const responseText = response.text || 'No response generated'

      return responseText
    } catch (error: any) {
      console.error('Gemini API error:', error)
      throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`)
    }
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

