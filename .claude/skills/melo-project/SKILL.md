# MELO Project Skill

## Project Overview

MELO is an AI-powered social media marketing platform designed for small and medium businesses. It helps users create, manage, and optimize social media content across multiple platforms.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Ant Design
- **Backend**: Node.js + Express + MongoDB
- **Styling**: CSS Modules with flat gradient design system
- **AI**: OpenAI GPT integration for content generation

### Design System

#### Color Themes
- **Green Theme (Default)**: `#10b981` (primary), `#34d399` (light), `#059669` (dark)
- **Warm Theme**: `#ae906e` (primary), `#c4a882` (light), `#8a7355` (dark)

#### CSS Patterns
- Gradient backgrounds: `linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)`
- Multi-layer shadows for depth
- Decorative gradient lines using `::after` pseudo-elements
- Hover effects with `translateX/translateY` transforms
- Theme support via `[data-theme="warm"]` selectors

---

## Copywriting Skill

This skill describes how to generate effective marketing copy based on brand information and target audience for the MELO platform.

### Brand Profile Components

When generating copy, always consider these brand profile elements:

1. **Brand Name** - The business identity
2. **Industry** - Business sector (e.g., Fashion, Technology, Food & Beverage)
3. **Target Audience** - Demographics and psychographics
4. **Brand Tone** - Voice characteristics (Professional, Casual, Playful, Authoritative)
5. **Product Knowledge** - Key products/services and unique selling points

### Target Audience Analysis

#### Demographics to Consider
- Age range
- Gender distribution
- Location/Region
- Income level
- Education background
- Occupation

#### Psychographics to Consider
- Interests and hobbies
- Values and beliefs
- Pain points and challenges
- Goals and aspirations
- Buying behavior
- Content consumption habits

### Platform-Specific Copywriting Guidelines

#### LinkedIn
- **Tone**: Professional, informative, thought-leadership focused
- **Length**: 150-300 words for posts, concise for comments
- **Style**: Industry insights, business achievements, professional tips
- **Hashtags**: 3-5 relevant industry hashtags
- **CTA**: Engagement-focused (thoughts, experiences, opinions)

#### Twitter/X
- **Tone**: Conversational, witty, timely
- **Length**: Under 280 characters, thread for longer content
- **Style**: Quick insights, hot takes, engagement hooks
- **Hashtags**: 1-2 trending or niche hashtags
- **CTA**: Retweets, replies, follows

#### Instagram
- **Tone**: Visual-first, lifestyle-oriented, authentic
- **Length**: Caption 125-150 characters (before "more"), up to 2200 max
- **Style**: Story-driven, emoji-friendly, relatable
- **Hashtags**: 5-10 mix of popular and niche
- **CTA**: Save, share, link in bio

#### Facebook
- **Tone**: Community-focused, conversational, inclusive
- **Length**: 40-80 characters optimal, up to 500 for detailed posts
- **Style**: Questions, stories, behind-the-scenes
- **Hashtags**: 1-2 only
- **CTA**: Comments, shares, reactions

#### TikTok
- **Tone**: Entertaining, trendy, authentic
- **Length**: Brief captions, let video speak
- **Style**: Trend-based, hook-first, challenge-oriented
- **Hashtags**: 3-5 including trending ones
- **CTA**: Follow, duet, stitch

### Copy Generation Framework

#### Step 1: Brand Voice Calibration
```
Input: Brand Profile
Output: Tone guidelines, vocabulary preferences, messaging pillars
```

Match the brand tone to appropriate language:
- **Professional**: Formal language, industry terms, data-driven claims
- **Casual**: Conversational, contractions, relatable scenarios
- **Playful**: Humor, wordplay, emojis, pop culture references
- **Authoritative**: Expert positioning, research-backed, thought leadership

#### Step 2: Audience Alignment
```
Input: Target Audience Profile
Output: Pain points, desires, language patterns
```

Tailor messaging to audience:
- Speak to their specific challenges
- Use language they understand and relate to
- Address their aspirations
- Match their communication style

#### Step 3: Content Purpose Definition
```
Input: Campaign Goals
Output: Content type, CTA strategy, success metrics
```

Content purposes:
- **Awareness**: Introduce brand, share values, tell story
- **Engagement**: Start conversations, ask questions, create polls
- **Conversion**: Promote offers, drive action, highlight benefits
- **Retention**: Provide value, exclusive content, community building

#### Step 4: Copy Structure

**Hook** (First line - grab attention)
- Question that resonates
- Bold statement
- Surprising statistic
- Relatable scenario

**Body** (Value delivery)
- Address pain point
- Present solution
- Share insight/story
- Provide proof/examples

**CTA** (Action prompt)
- Clear next step
- Low friction
- Benefit-focused
- Urgency when appropriate

### Copy Templates

#### Product Launch
```
[Hook: Problem statement or intriguing question]
[Body: Introduce product as solution, key benefits]
[Social proof: Testimonial or statistic]
[CTA: How to get/learn more]
```

#### Educational Content
```
[Hook: "Did you know..." or common misconception]
[Body: Teach concept in simple terms]
[Example: Real-world application]
[CTA: Save for later, share with someone who needs this]
```

#### Behind-the-Scenes
```
[Hook: Exclusive peek teaser]
[Body: Story of process/team/creation]
[Human element: Names, challenges, victories]
[CTA: What do you want to see next?]
```

#### User-Generated Content
```
[Hook: Customer highlight]
[Body: Their story with your product]
[Tag: Original creator credit]
[CTA: Share your story, use our hashtag]
```

### Quality Checklist

Before finalizing copy, verify:

- [ ] Matches brand voice and tone
- [ ] Speaks to target audience pain points/desires
- [ ] Platform-appropriate length and format
- [ ] Clear and compelling hook
- [ ] Value-driven body content
- [ ] Specific and actionable CTA
- [ ] Grammar and spelling checked
- [ ] Hashtags are relevant and current
- [ ] Emojis align with brand guidelines
- [ ] No offensive or exclusionary language

### A/B Testing Suggestions

For each copy piece, consider testing:
- Different hooks (question vs statement vs statistic)
- Various CTAs (action-oriented vs benefit-focused)
- Emoji usage (with vs without)
- Post length (short vs detailed)
- Posting times (morning vs evening vs weekend)

---

## Code Conventions

### Component Naming
- React components: `PascalCase` (e.g., `BrandProfile.tsx`)
- CSS modules: `camelCase` classes (e.g., `.brandCard`)
- Hooks: `use` prefix (e.g., `useBrandData`)

### Directory Structure
```
frontend/src/
├── components/     # Reusable UI components
├── pages/          # Route-level components
├── hooks/          # Custom React hooks
├── utils/          # Helper functions
├── types/          # TypeScript interfaces
└── assets/         # Images, fonts, static files
```

### CSS Module Patterns
- Use CSS variables for theme colors
- Implement warm theme variants with `[data-theme="warm"]`
- Apply consistent border-radius (8px, 12px, 16px scale)
- Use transition for interactive elements (0.25s-0.3s ease)
