import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { geminiService } from './geminiService.js'
import { generateImage } from './imageGenerationService.js'
import { uploadToS3, isS3Configured, getS3PublicUrl } from './s3Service.js'
import type { IRecurringSchedule, JobHuntTone } from '../models/RecurringSchedule.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const UPLOADS_DIR = path.join(__dirname, '../../uploads/images')

export interface JobHuntPromptConfig {
  subDomains: string[]
  tone: JobHuntTone
  hotTopics: string[]
  position?: string
}

export interface GeneratedPost {
  title: string
  content: string
  imagePrompt: string
}

export interface GeneratedPostWithImage {
  title: string
  content: string
  imageUrl: string | null
  imageError?: string
}

const TONE_DESCRIPTIONS: Record<JobHuntTone, string> = {
  technical:
    'calm, curious, slightly self-deprecating. Sound like an early-career developer who is genuinely learning something, not lecturing anyone.',
  storytelling:
    'casual journal entry. Start with a small moment, let the technical bit come out naturally, like talking to a coworker.',
  achievement:
    'low-key proud. Share something built or learned, focus on what surprised you, never brag with numbers you cannot back up.',
}

export function buildJobHuntSystemPrompt(config: JobHuntPromptConfig): string {
  const focusAreas =
    config.subDomains.length > 0
      ? config.subDomains.join(', ')
      : 'general full-stack / software engineering / AI engineering'
  const keywords =
    config.hotTopics.length > 0
      ? config.hotTopics.join(', ')
      : '(no specific keywords this time, pick one current topic from the focus areas that a junior developer would find genuinely interesting)'
  const tone = TONE_DESCRIPTIONS[config.tone]
  const topicLine =
    config.hotTopics.length > 0
      ? 'Pick exactly ONE keyword from "Hot topics / keywords" above as the topic of this post. Do not try to cover several.'
      : 'Pick one specific small topic inside the focus areas. Just one. Make it concrete (a tool, a concept, a tiny bug you debugged), not abstract.'

  return `You are writing a LinkedIn post for Xingyuan Zhou, a full-stack developer in Auckland who is looking for junior/graduate full-stack, software engineering, or AI engineering roles.

Write in a natural human voice. The post should sound like a real early-career developer sharing what they are learning, building, or thinking about. It should NOT sound like an AI influencer, marketing guru, senior researcher, or corporate account.

Topic:
${topicLine}

Focus areas:
${focusAreas}

Hot topics / keywords:
${keywords}

Tone:
${tone}

Post goal:
Share a useful technical reflection. The job search is signalled ONLY by the #OpenToWork hashtag; do not write about job hunting in the post body.

Hard rules:
1. Do not invent fake benchmark results, numbers, production experience, client work, or claims.
2. Do not say "I benchmarked", "we achieved", "in production", or "at scale" unless the user explicitly provides that information.
3. Avoid aggressive hooks like "Stop doing X", "You are doing X wrong", "Most engineers don't understand...".
4. Avoid overconfident or dramatic words such as "fundamentally flawed", "massive breakthrough", "game changer", "10x", "revolutionary".
5. Use simple, clear English. IELTS 6.5 to 7 style is okay. Do not use too many buzzwords.
6. Keep the post around 120 to 180 words.
7. Focus on one main idea only.
8. Make it personal: include phrases like "I recently learned", "While building my project", "One thing I noticed", or "I used to think".
9. Include one concrete technical detail, but explain it simply.
10. End with a small personal reflection OR a one-line takeaway. NEVER end with a question. The last sentence of the post body must NOT contain a question mark. No "Does anyone...", "Is this...", "How do you...", "What do you think...", no engagement-bait of any form. If you want to share an opinion, state it as a statement, not a question.
11. Add 3 to 5 relevant hashtags on the last line. Always include #OpenToWork as one of them. Do NOT include #hiring.
12. Do NOT write about job hunting, job search, hiring, or being open to roles in the post body. The #OpenToWork hashtag is the ONLY job-search signal. Phrases like "open to new roles", "DMs welcome", "looking for opportunities", "next role", "exploring positions" are banned from the body.
13. NEVER use em-dashes or en-dashes. Use a period or comma instead.
14. Spelling: it is "pgvector" not "pvector", "Postgres" not "Postgress", "Hugging Face" not "Huggingface", "OpenAI" not "Open AI". Double-check tool names.

Recommended structure:
- Line 1: A natural hook, not clickbait.
- Paragraph 1: What I recently learned or noticed.
- Paragraph 2: One simple technical explanation or project connection.
- Paragraph 3: My reflection or trade-off.
- Final line: a soft question OR a small reflection (rotate; see rule 10).
- Hashtags on the very last line.

Image prompt rules (for the imagePrompt field):
- The image is for an early-career developer's learning post on LinkedIn. Professional but NOT corporate.
- Prefer one of: a simple diagram, a calm developer workspace scene, or an abstract tech illustration.
- DO NOT generate: fake metrics, fake dashboards, unreadable code/text, exaggerated AI-robot imagery, generic stock-photo people.
- Avoid putting any readable text or numbers in the image.
- Style: minimal, calm, suitable for a real person sharing a learning reflection.
- Wrap the visual idea in this template so the image model gets the full context:
  "Create a clean, natural LinkedIn image for an early-career developer's technical learning post. The image should feel professional but not corporate. <YOUR ONE-LINE VISUAL CONCEPT HERE, tied to the post topic>. Style: minimal, calm, no readable text, no fake dashboards or robot imagery."

Return STRICT JSON in this exact shape, nothing else (no markdown fences, no commentary):
{
  "postText": "<the LinkedIn post body, ready to paste, including the hashtag line>",
  "imagePrompt": "<the full image-generation prompt following the rules above>",
  "safetyNotes": ["<optional notes about anything you deliberately avoided; may be an empty array>"]
}`
}

export async function generateJobHuntPostContent(
  schedule: Pick<IRecurringSchedule, 'subDomains' | 'tone' | 'hotTopics' | 'imageStyle'>
): Promise<GeneratedPost> {
  const systemPrompt = buildJobHuntSystemPrompt({
    subDomains: schedule.subDomains,
    tone: schedule.tone,
    hotTopics: schedule.hotTopics,
  })

  const userPrompt = `${systemPrompt}

Now generate one LinkedIn post following the rules above. Return ONLY the JSON object, no commentary, no markdown fences.`

  const raw = await geminiService.generateContent({
    messages: [
      { role: 'user', content: userPrompt },
    ],
  })

  const parsed = extractJson(raw)
  // Accept the new field name (postText) or fall back to the legacy one (content)
  const postBody: string | undefined =
    typeof parsed?.postText === 'string'
      ? parsed.postText
      : typeof parsed?.content === 'string'
        ? parsed.content
        : undefined
  if (!parsed || !postBody) {
    throw new Error('Gemini did not return a valid job-hunt post payload')
  }

  const customStyle =
    schedule.imageStyle && schedule.imageStyle.trim() !== 'clean tech illustration'
      ? ` Visual style hint: ${schedule.imageStyle.trim()}.`
      : ''

  // Derive a short internal title from the first non-empty line of the post body
  const firstLine = postBody.split('\n').find((l) => l.trim().length > 0) || 'Job Hunt Post'
  const title = firstLine.replace(/[#*_`]/g, '').trim().slice(0, 80)

  return {
    title,
    content: sanitizeContent(postBody),
    imagePrompt: String(parsed.imagePrompt || postBody.slice(0, 200)).trim() + customStyle,
  }
}

function sanitizeContent(raw: string): string {
  let text = raw
    .replace(/[—–]/g, ',') // em/en-dash -> comma
    .replace(/ ,/g, ',') // tidy stray spaces before comma
    .replace(/,,+/g, ',') // collapse double commas
    .trim()

  // Strip a trailing question sentence from the body (the line(s) right above
  // the hashtag line). The prompt forbids question endings, but we belt-and-
  // braces it here so a question never makes it onto LinkedIn.
  const lines = text.split('\n')
  // Find the hashtag line (last non-empty line that starts with #), if any
  let hashIdx = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i].trim()
    if (l.length === 0) continue
    if (l.startsWith('#')) hashIdx = i
    break
  }

  // The "body end" is the last non-empty paragraph above the hashtag line
  const bodyEndIdx = hashIdx === -1 ? lines.length - 1 : hashIdx - 1
  // Walk back to the previous non-empty line
  let lastBodyLineIdx = bodyEndIdx
  while (lastBodyLineIdx >= 0 && lines[lastBodyLineIdx].trim() === '') lastBodyLineIdx--

  if (lastBodyLineIdx >= 0 && /\?\s*$/.test(lines[lastBodyLineIdx])) {
    // Drop that question line entirely. Better to end abruptly than ship a CTA.
    lines.splice(lastBodyLineIdx, 1)
    // Collapse any double blank lines created by the removal
    text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  }

  return text
}

export async function generateJobHuntPostWithImage(
  schedule: Pick<
    IRecurringSchedule,
    'subDomains' | 'tone' | 'hotTopics' | 'imageStyle' | 'includeImage' | 'userId'
  >
): Promise<GeneratedPostWithImage> {
  const post = await generateJobHuntPostContent(schedule)

  if (!schedule.includeImage) {
    return { title: post.title, content: post.content, imageUrl: null }
  }

  try {
    const dataUrl = await generateImage(post.imagePrompt)
    const imageUrl = await persistDataUrl(dataUrl, schedule.userId?.toString?.())
    return { title: post.title, content: post.content, imageUrl }
  } catch (err: any) {
    const errMsg = err?.message || String(err)
    console.error('[jobHunt] image generation failed, falling back to text-only post:', errMsg)
    return { title: post.title, content: post.content, imageUrl: null, imageError: errMsg }
  }
}

function extractJson(raw: string): any {
  const trimmed = raw.trim()
  // Strip ```json ... ``` if present
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const candidate = fenced ? fenced[1] : trimmed
  try {
    return JSON.parse(candidate)
  } catch {
    // Try to find first { ... } block
    const match = candidate.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

async function persistDataUrl(dataUrl: string, userId?: string): Promise<string> {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/)
  if (!match) {
    throw new Error('Invalid image data URL')
  }
  const mimeType = match[1]
  const ext = mimeType.split('/')[1] || 'png'
  const buffer = Buffer.from(match[2], 'base64')
  const filename = `jobhunt-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`

  if (isS3Configured()) {
    const result = await uploadToS3(buffer, filename, mimeType, 'images', userId, true)
    return getS3PublicUrl(result.key)
  }

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
  const filePath = path.join(UPLOADS_DIR, filename)
  fs.writeFileSync(filePath, buffer)
  return `/uploads/images/${filename}`
}
