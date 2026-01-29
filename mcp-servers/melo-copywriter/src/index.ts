#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  buildSystemPrompt,
  buildContentPlanPrompt,
  PLATFORM_RULES,
  TONE_GUIDELINES,
} from "./copywriting-rules.js";

// Initialize Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is required");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Input schemas
const GenerateCopySchema = z.object({
  topic: z.string().describe("The topic or subject for the copy"),
  platform: z.string().describe("Target platform (instagram, twitter, linkedin, facebook, tiktok, xiaohongshu)"),
  brandName: z.string().optional().describe("Brand name"),
  industry: z.string().optional().describe("Industry sector"),
  targetAudience: z.array(z.string()).optional().describe("Target audience segments"),
  tone: z.string().optional().describe("Brand tone (professional, casual, playful, authoritative, warm, calm, mindful)"),
  language: z.string().optional().describe("Output language (default: English)"),
  additionalContext: z.string().optional().describe("Any additional context or requirements"),
});

const GenerateContentPlanSchema = z.object({
  goal: z.string().describe("Campaign or content goal"),
  platforms: z.array(z.string()).describe("Target platforms"),
  startDate: z.string().describe("Start date (YYYY-MM-DD)"),
  endDate: z.string().describe("End date (YYYY-MM-DD)"),
  brandName: z.string().optional().describe("Brand name"),
  industry: z.string().optional().describe("Industry sector"),
  targetAudience: z.array(z.string()).optional().describe("Target audience segments"),
  tone: z.string().optional().describe("Brand tone"),
  language: z.string().optional().describe("Output language"),
  postsPerWeek: z.number().optional().describe("Number of posts per week (default: 3-5)"),
});

const ImprovesCopySchema = z.object({
  originalCopy: z.string().describe("The original copy to improve"),
  platform: z.string().describe("Target platform"),
  improvementFocus: z.string().optional().describe("What to focus on: engagement, clarity, cta, hook, or all"),
  brandName: z.string().optional().describe("Brand name for context"),
  tone: z.string().optional().describe("Desired tone"),
});

// Create MCP Server
const server = new Server(
  {
    name: "melo-copywriter",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_copy",
        description: `Generate social media copy with built-in MELO copywriting rules.
Supports platforms: ${Object.keys(PLATFORM_RULES).join(", ")}.
Supports tones: ${Object.keys(TONE_GUIDELINES).join(", ")}.
Returns structured JSON with copy, hashtags, hook, CTA, and suggestions.`,
        inputSchema: {
          type: "object",
          properties: {
            topic: { type: "string", description: "The topic or subject for the copy" },
            platform: { type: "string", description: "Target platform" },
            brandName: { type: "string", description: "Brand name" },
            industry: { type: "string", description: "Industry sector" },
            targetAudience: { type: "array", items: { type: "string" }, description: "Target audience segments" },
            tone: { type: "string", description: "Brand tone" },
            language: { type: "string", description: "Output language" },
            additionalContext: { type: "string", description: "Additional context" },
          },
          required: ["topic", "platform"],
        },
      },
      {
        name: "generate_content_plan",
        description: `Generate a multi-day social media content plan with MELO copywriting rules.
Each post follows platform-specific guidelines for tone, length, and style.
Returns structured JSON with dated posts, hashtags, and content types.`,
        inputSchema: {
          type: "object",
          properties: {
            goal: { type: "string", description: "Campaign goal" },
            platforms: { type: "array", items: { type: "string" }, description: "Target platforms" },
            startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
            endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
            brandName: { type: "string", description: "Brand name" },
            industry: { type: "string", description: "Industry sector" },
            targetAudience: { type: "array", items: { type: "string" }, description: "Target audience" },
            tone: { type: "string", description: "Brand tone" },
            language: { type: "string", description: "Output language" },
            postsPerWeek: { type: "number", description: "Posts per week" },
          },
          required: ["goal", "platforms", "startDate", "endDate"],
        },
      },
      {
        name: "improve_copy",
        description: `Improve existing social media copy using MELO copywriting rules.
Analyzes and enhances: hook, body, CTA, hashtags, and overall engagement potential.
Returns improved version with explanation of changes.`,
        inputSchema: {
          type: "object",
          properties: {
            originalCopy: { type: "string", description: "Original copy to improve" },
            platform: { type: "string", description: "Target platform" },
            improvementFocus: { type: "string", description: "Focus area: engagement, clarity, cta, hook, or all" },
            brandName: { type: "string", description: "Brand name" },
            tone: { type: "string", description: "Desired tone" },
          },
          required: ["originalCopy", "platform"],
        },
      },
      {
        name: "get_platform_rules",
        description: "Get copywriting rules for a specific platform",
        inputSchema: {
          type: "object",
          properties: {
            platform: { type: "string", description: "Platform name" },
          },
          required: ["platform"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "generate_copy": {
        const params = GenerateCopySchema.parse(args);
        const systemPrompt = buildSystemPrompt({
          brandName: params.brandName,
          industry: params.industry,
          targetAudience: params.targetAudience,
          tone: params.tone,
          platform: params.platform,
          language: params.language,
        });

        const userPrompt = `Create social media copy about: ${params.topic}
${params.additionalContext ? `\nAdditional context: ${params.additionalContext}` : ""}`;

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
          ],
        });

        const responseText = response.text || "";

        // Try to parse JSON response
        let result;
        try {
          // Remove markdown code blocks if present
          let jsonText = responseText.trim();
          const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }
          result = JSON.parse(jsonText);
        } catch {
          // If parsing fails, return raw text with structure
          result = {
            copy: responseText,
            hashtags: [],
            platform: params.platform,
            parseError: "Could not parse structured response",
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "generate_content_plan": {
        const params = GenerateContentPlanSchema.parse(args);
        const systemPrompt = buildContentPlanPrompt({
          brandName: params.brandName,
          industry: params.industry,
          targetAudience: params.targetAudience,
          tone: params.tone,
          platforms: params.platforms,
          startDate: params.startDate,
          endDate: params.endDate,
          goal: params.goal,
          language: params.language,
        });

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
          ],
        });

        const responseText = response.text || "";

        let result;
        try {
          let jsonText = responseText.trim();
          const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }
          // Also try to find JSON object directly
          const objectMatch = jsonText.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            jsonText = objectMatch[0];
          }
          result = JSON.parse(jsonText);

          // Validate items
          if (result.items) {
            result.items = result.items.filter((item: any) =>
              item.date &&
              item.platform &&
              item.content &&
              item.date >= params.startDate &&
              item.date <= params.endDate &&
              params.platforms.some(p =>
                p.toLowerCase() === item.platform.toLowerCase()
              )
            );
          }
        } catch {
          result = {
            items: [],
            error: "Could not parse content plan",
            rawResponse: responseText,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "improve_copy": {
        const params = ImprovesCopySchema.parse(args);
        const platformRule = PLATFORM_RULES[params.platform.toLowerCase()];

        const prompt = `You are an expert copywriter. Improve the following social media copy.

## Original Copy
${params.originalCopy}

## Platform: ${params.platform}
${platformRule ? `
- Tone: ${platformRule.tone}
- Length: ${platformRule.length}
- Style: ${platformRule.style}
- Hashtags: ${platformRule.hashtags}
- CTA: ${platformRule.cta}
` : ""}

## Improvement Focus: ${params.improvementFocus || "all"}
${params.brandName ? `## Brand: ${params.brandName}` : ""}
${params.tone ? `## Desired Tone: ${TONE_GUIDELINES[params.tone.toLowerCase()] || params.tone}` : ""}

Return a JSON object:
{
  "improvedCopy": "The improved copy here",
  "hashtags": ["improved", "hashtags"],
  "changes": ["List of changes made"],
  "reasoning": "Why these changes improve the copy",
  "engagementScore": 8,
  "originalScore": 5
}`;

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            { role: "user", parts: [{ text: prompt }] },
          ],
        });

        const responseText = response.text || "";

        let result;
        try {
          let jsonText = responseText.trim();
          const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }
          result = JSON.parse(jsonText);
        } catch {
          result = {
            improvedCopy: responseText,
            changes: ["Could not parse structured response"],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_platform_rules": {
        const platform = (args as { platform: string }).platform.toLowerCase();
        const rules = PLATFORM_RULES[platform];

        if (!rules) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: `Platform "${platform}" not found`,
                  availablePlatforms: Object.keys(PLATFORM_RULES),
                }, null, 2),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                platform,
                rules,
                tones: TONE_GUIDELINES,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MELO Copywriter MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
