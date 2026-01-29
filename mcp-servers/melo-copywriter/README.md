# MELO Copywriter MCP Server

An MCP (Model Context Protocol) server that provides AI-powered copywriting tools with built-in MELO platform rules for consistent, high-quality social media content generation.

## Features

- **Platform-Specific Rules**: Built-in copywriting guidelines for LinkedIn, Twitter/X, Instagram, Facebook, TikTok, and Xiaohongshu
- **Tone Calibration**: Support for professional, casual, playful, authoritative, warm, calm, and mindful tones
- **Structured Output**: Returns JSON with copy, hashtags, hooks, CTAs, and improvement suggestions
- **Content Planning**: Generate multi-day content plans with proper post distribution
- **Copy Improvement**: Analyze and enhance existing copy with specific recommendations

## Tools Available

### 1. `generate_copy`
Generate social media copy for a specific platform with brand context.

**Parameters:**
- `topic` (required): The topic or subject for the copy
- `platform` (required): Target platform (instagram, twitter, linkedin, etc.)
- `brandName`: Brand name for context
- `industry`: Industry sector
- `targetAudience`: Array of target audience segments
- `tone`: Brand tone (professional, casual, playful, etc.)
- `language`: Output language (default: English)
- `additionalContext`: Any additional requirements

### 2. `generate_content_plan`
Generate a multi-day social media content plan.

**Parameters:**
- `goal` (required): Campaign or content goal
- `platforms` (required): Array of target platforms
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `brandName`, `industry`, `targetAudience`, `tone`, `language`: Same as generate_copy
- `postsPerWeek`: Number of posts per week

### 3. `improve_copy`
Improve existing social media copy.

**Parameters:**
- `originalCopy` (required): The original copy to improve
- `platform` (required): Target platform
- `improvementFocus`: Focus area (engagement, clarity, cta, hook, or all)
- `brandName`, `tone`: Context for improvement

### 4. `get_platform_rules`
Get copywriting rules for a specific platform.

**Parameters:**
- `platform` (required): Platform name

## Installation

```bash
cd mcp-servers/melo-copywriter
npm install
npm run build
```

## Configuration

Add to your Claude Code MCP settings (`~/.claude/settings.json` or project `.claude/settings.local.json`):

```json
{
  "mcpServers": {
    "melo-copywriter": {
      "command": "node",
      "args": ["d:/React/Melo/mcp-servers/melo-copywriter/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-gemini-api-key",
        "GEMINI_MODEL": "gemini-2.0-flash"
      }
    }
  }
}
```

## Environment Variables

- `GEMINI_API_KEY` (required): Your Google Gemini API key
- `GEMINI_MODEL` (optional): Gemini model to use (default: gemini-2.0-flash)

## Platform Guidelines

| Platform | Tone | Length | Hashtags |
|----------|------|--------|----------|
| LinkedIn | Professional | 150-300 words | 3-5 |
| Twitter/X | Conversational | <280 chars | 1-2 |
| Instagram | Visual-first | 125-2200 chars | 5-10 |
| Facebook | Community-focused | 40-500 chars | 1-2 |
| TikTok | Entertaining | Brief | 3-5 |
| Xiaohongshu | Personal | 300-500 chars | 5-10 |

## Example Usage

Once configured, you can use these tools in Claude Code:

```
Generate an Instagram post about our new spring collection for a fashion brand targeting millennials with a playful tone.
```

Claude will use the `generate_copy` tool with the MELO copywriting rules automatically applied.
