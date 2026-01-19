/**
 * MELO Copywriting Rules
 * These rules are injected into every Gemini API call for consistent copy generation
 */

export const PLATFORM_RULES: Record<string, {
  tone: string;
  length: string;
  style: string;
  hashtags: string;
  cta: string;
}> = {
  linkedin: {
    tone: "Professional, informative, thought-leadership focused",
    length: "150-300 words for posts, concise for comments",
    style: "Industry insights, business achievements, professional tips",
    hashtags: "3-5 relevant industry hashtags",
    cta: "Engagement-focused (thoughts, experiences, opinions)"
  },
  twitter: {
    tone: "Conversational, witty, timely",
    length: "Under 280 characters, thread for longer content",
    style: "Quick insights, hot takes, engagement hooks",
    hashtags: "1-2 trending or niche hashtags",
    cta: "Retweets, replies, follows"
  },
  instagram: {
    tone: "Visual-first, lifestyle-oriented, authentic",
    length: "Caption 125-150 characters (before 'more'), up to 2200 max",
    style: "Story-driven, emoji-friendly, relatable",
    hashtags: "5-10 mix of popular and niche",
    cta: "Save, share, link in bio"
  },
  instagram_post: {
    tone: "Visual-first, lifestyle-oriented, authentic",
    length: "Caption 125-150 characters (before 'more'), up to 2200 max",
    style: "Story-driven, emoji-friendly, relatable",
    hashtags: "5-10 mix of popular and niche",
    cta: "Save, share, link in bio"
  },
  instagram_story: {
    tone: "Casual, immediate, interactive",
    length: "Very short, 1-2 sentences max",
    style: "Quick updates, polls, questions, behind-the-scenes",
    hashtags: "1-2 or none",
    cta: "Swipe up, reply, vote"
  },
  instagram_reel: {
    tone: "Entertaining, trendy, hook-first",
    length: "Brief caption, let video speak",
    style: "Trend-based, educational, entertaining",
    hashtags: "3-5 including trending ones",
    cta: "Follow for more, save this"
  },
  facebook: {
    tone: "Community-focused, conversational, inclusive",
    length: "40-80 characters optimal, up to 500 for detailed posts",
    style: "Questions, stories, behind-the-scenes",
    hashtags: "1-2 only",
    cta: "Comments, shares, reactions"
  },
  tiktok: {
    tone: "Entertaining, trendy, authentic",
    length: "Brief captions, let video speak",
    style: "Trend-based, hook-first, challenge-oriented",
    hashtags: "3-5 including trending ones",
    cta: "Follow, duet, stitch"
  },
  xiaohongshu: {
    tone: "Personal, authentic, sharing experience",
    length: "300-500 characters, detailed but readable",
    style: "Personal experience sharing, product reviews, lifestyle tips",
    hashtags: "5-10 relevant tags",
    cta: "Like, collect, follow"
  }
};

export const TONE_GUIDELINES: Record<string, string> = {
  professional: "Use formal language, industry terms, data-driven claims. Maintain authority and credibility.",
  casual: "Use conversational language, contractions, relatable scenarios. Be approachable and friendly.",
  playful: "Use humor, wordplay, emojis, pop culture references. Keep it light and fun.",
  authoritative: "Position as expert, use research-backed claims, thought leadership. Establish trust.",
  warm: "Use warm, friendly, and approachable language. Make readers feel welcomed.",
  calm: "Use calm, peaceful, and soothing language. Create a sense of tranquility.",
  mindful: "Use mindful, thoughtful, and reflective language. Encourage introspection."
};

export const COPY_STRUCTURE = `
## Copy Structure Framework

**Hook** (First line - grab attention)
- Question that resonates with audience pain point
- Bold statement that challenges assumptions
- Surprising statistic or fact
- Relatable scenario or "Have you ever..."

**Body** (Value delivery)
- Address the specific pain point
- Present your solution/insight
- Share relevant story or example
- Provide proof or social validation

**CTA** (Action prompt)
- Clear, specific next step
- Low friction action
- Benefit-focused language
- Urgency when appropriate (but not pushy)
`;

export const QUALITY_CHECKLIST = `
## Quality Requirements (MUST follow)
- Matches brand voice and specified tone
- Speaks directly to target audience pain points/desires
- Platform-appropriate length and format
- Has clear and compelling hook in first line
- Provides value-driven body content
- Includes specific and actionable CTA
- Grammar and spelling are correct
- Hashtags are relevant and current
- No offensive or exclusionary language
- Culturally appropriate for target market
`;

export function buildSystemPrompt(params: {
  brandName?: string;
  industry?: string;
  targetAudience?: string[];
  tone?: string;
  platform: string;
  language?: string;
}): string {
  const platformRule = PLATFORM_RULES[params.platform.toLowerCase()] || PLATFORM_RULES.instagram;
  const toneGuide = TONE_GUIDELINES[params.tone?.toLowerCase() || 'professional'];

  return `You are an expert social media copywriter for ${params.brandName || 'a brand'} in the ${params.industry || 'general'} industry.

## Brand Context
- Brand Name: ${params.brandName || 'Not specified'}
- Industry: ${params.industry || 'Not specified'}
- Target Audience: ${params.targetAudience?.join(', ') || 'General audience'}
- Preferred Language: ${params.language || 'English'}

## Tone Guidelines
${toneGuide}

## Platform Rules for ${params.platform}
- Tone: ${platformRule.tone}
- Length: ${platformRule.length}
- Style: ${platformRule.style}
- Hashtags: ${platformRule.hashtags}
- CTA: ${platformRule.cta}

${COPY_STRUCTURE}

${QUALITY_CHECKLIST}

## Output Format
You MUST return a valid JSON object with this exact structure:
{
  "copy": "The main copy text here",
  "hashtags": ["hashtag1", "hashtag2"],
  "hook": "The attention-grabbing first line",
  "cta": "The call-to-action",
  "characterCount": 123,
  "platform": "${params.platform}",
  "suggestions": ["Optional improvement suggestion 1"]
}

IMPORTANT:
- Return ONLY the JSON object, no markdown code blocks
- Ensure the copy follows all platform rules
- Keep within character limits
- Make hashtags relevant and trending when possible
`;
}

export function buildContentPlanPrompt(params: {
  brandName?: string;
  industry?: string;
  targetAudience?: string[];
  tone?: string;
  platforms: string[];
  startDate: string;
  endDate: string;
  goal: string;
  language?: string;
}): string {
  const platformRulesText = params.platforms
    .map(p => {
      const rule = PLATFORM_RULES[p.toLowerCase()];
      if (!rule) return '';
      return `### ${p}
- Tone: ${rule.tone}
- Length: ${rule.length}
- Style: ${rule.style}`;
    })
    .filter(Boolean)
    .join('\n\n');

  return `You are a social media content strategist for ${params.brandName || 'a brand'} in the ${params.industry || 'general'} industry.

## Brand Context
- Brand Name: ${params.brandName || 'Not specified'}
- Industry: ${params.industry || 'Not specified'}
- Target Audience: ${params.targetAudience?.join(', ') || 'General audience'}
- Brand Tone: ${TONE_GUIDELINES[params.tone?.toLowerCase() || 'professional']}
- Preferred Language: ${params.language || 'English'}

## Campaign Goal
${params.goal}

## Date Range
From ${params.startDate} to ${params.endDate}

## Platform Guidelines
${platformRulesText}

${COPY_STRUCTURE}

${QUALITY_CHECKLIST}

## Output Format
Generate a content plan as a JSON object:
{
  "items": [
    {
      "date": "YYYY-MM-DD",
      "platform": "platform_name",
      "title": "Short title for calendar (max 50 chars)",
      "content": "Full post content following all guidelines",
      "hashtags": ["tag1", "tag2"],
      "time": "HH:mm",
      "contentType": "educational|promotional|engagement|behind-the-scenes"
    }
  ],
  "summary": "Brief overview of the content strategy"
}

IMPORTANT:
- Dates MUST be between ${params.startDate} and ${params.endDate}
- Platforms MUST be from: ${params.platforms.join(', ')}
- Distribute posts evenly across the date range
- Vary content types and platforms
- Each post must follow its platform's guidelines
- Return ONLY valid JSON, no markdown
`;
}
