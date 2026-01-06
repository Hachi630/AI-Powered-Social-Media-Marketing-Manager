import { geminiService, UserContext } from '../services/geminiService'

describe('Gemini Service', () => {
  describe('buildSystemPrompt', () => {
    it('should return default prompt when no context provided', () => {
      const prompt = geminiService.buildSystemPrompt()
      expect(prompt).toBe('You are a helpful AI assistant.')
    })

    it('should return default prompt when empty context provided', () => {
      const prompt = geminiService.buildSystemPrompt({})
      expect(prompt).toContain('You are an AI assistant')
    })

    it('should include brand name in prompt', () => {
      const context: UserContext = {
        brandName: 'TestBrand'
      }
      const prompt = geminiService.buildSystemPrompt(context)
      expect(prompt).toContain('TestBrand')
    })

    it('should include industry in prompt', () => {
      const context: UserContext = {
        industry: 'Technology'
      }
      const prompt = geminiService.buildSystemPrompt(context)
      expect(prompt).toContain('Technology')
      expect(prompt).toContain('industry')
    })

    it('should include tone of voice description', () => {
      const context: UserContext = {
        toneOfVoice: 'warm'
      }
      const prompt = geminiService.buildSystemPrompt(context)
      expect(prompt).toContain('warm')
      expect(prompt).toContain('friendly')
      expect(prompt).toContain('approachable')
    })

    it('should handle calm tone', () => {
      const context: UserContext = {
        toneOfVoice: 'calm'
      }
      const prompt = geminiService.buildSystemPrompt(context)
      expect(prompt).toContain('calm')
      expect(prompt).toContain('peaceful')
      expect(prompt).toContain('soothing')
    })

    it('should handle mindful tone', () => {
      const context: UserContext = {
        toneOfVoice: 'mindful'
      }
      const prompt = geminiService.buildSystemPrompt(context)
      expect(prompt).toContain('mindful')
      expect(prompt).toContain('thoughtful')
      expect(prompt).toContain('reflective')
    })

    it('should include knowledge products', () => {
      const context: UserContext = {
        knowledgeProducts: ['Product A', 'Product B', 'Product C']
      }
      const prompt = geminiService.buildSystemPrompt(context)
      expect(prompt).toContain('Product A')
      expect(prompt).toContain('Product B')
      expect(prompt).toContain('Product C')
      expect(prompt).toContain('knowledge about these products')
    })

    it('should include target audience', () => {
      const context: UserContext = {
        targetAudience: ['Young Professionals', 'Students']
      }
      const prompt = geminiService.buildSystemPrompt(context)
      expect(prompt).toContain('Young Professionals')
      expect(prompt).toContain('Students')
      expect(prompt).toContain('target audience')
    })

    it('should build complete prompt with all fields', () => {
      const context: UserContext = {
        brandName: 'Melo',
        industry: 'Social Media',
        toneOfVoice: 'warm',
        knowledgeProducts: ['Content Planning', 'Post Scheduling'],
        targetAudience: ['SMB Owners', 'Marketing Teams']
      }
      const prompt = geminiService.buildSystemPrompt(context)
      
      expect(prompt).toContain('Melo')
      expect(prompt).toContain('Social Media')
      expect(prompt).toContain('warm')
      expect(prompt).toContain('Content Planning')
      expect(prompt).toContain('Post Scheduling')
      expect(prompt).toContain('SMB Owners')
      expect(prompt).toContain('Marketing Teams')
      expect(prompt).toContain('professional manner')
    })

    it('should not include empty arrays', () => {
      const context: UserContext = {
        brandName: 'Test',
        knowledgeProducts: [],
        targetAudience: []
      }
      const prompt = geminiService.buildSystemPrompt(context)
      
      expect(prompt).toContain('Test')
      expect(prompt).not.toContain('knowledge about these products')
      expect(prompt).not.toContain('target audience')
    })

    it('should use custom tone if not in predefined list', () => {
      const context: UserContext = {
        toneOfVoice: 'professional'
      }
      const prompt = geminiService.buildSystemPrompt(context)
      expect(prompt).toContain('professional')
    })
  })
})

