/**
 * Parse campaign text and extract day-by-day calendar events
 */

export interface ParsedCampaignDay {
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  platform: string;
  time?: string;
  focus?: string;
  targetAudience?: string;
  caption?: string;
  visual?: string;
  cta?: string;
}

/**
 * Parse date from text like "Feb 8" or "February 8th"
 * Returns date in current year or next year if month has passed
 */
function parseDate(dateStr: string, baseYear?: number): string {
  const now = new Date();
  const year = baseYear || now.getFullYear();
  
  // Match patterns like "Feb 8", "February 8", "Feb 8th", "February 8th"
  const match = dateStr.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d+)/i);
  if (!match) {
    // Try full month names
    const fullMatch = dateStr.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d+)/i);
    if (fullMatch) {
      const monthName = fullMatch[1];
      const day = parseInt(fullMatch[2]);
      const monthMap: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
      };
      const month = monthMap[monthName.toLowerCase()];
      if (month !== undefined) {
        const date = new Date(year, month, day);
        return date.toISOString().split('T')[0];
      }
    }
    return '';
  }
  
  const monthStr = match[0].split(/\s+/)[0].toLowerCase();
  const day = parseInt(match[1]);
  
  const monthMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  
  const month = monthMap[monthStr.substring(0, 3)];
  if (month === undefined) return '';
  
  const date = new Date(year, month, day);
  return date.toISOString().split('T')[0];
}

/**
 * Extract timeline from text like "February 8th – February 14th"
 */
function extractTimeline(text: string): { startDate: string; endDate: string } | null {
  const timelineMatch = text.match(/Timeline:\s*([A-Za-z]+\s+\d+(?:st|nd|rd|th)?)\s*[–-]\s*([A-Za-z]+\s+\d+(?:st|nd|rd|th)?)/i);
  if (timelineMatch) {
    const startDate = parseDate(timelineMatch[1]);
    const endDate = parseDate(timelineMatch[2]);
    if (startDate && endDate) {
      return { startDate, endDate };
    }
  }
  return null;
}

/**
 * Parse campaign text and extract all days
 */
export function parseCampaignText(text: string): ParsedCampaignDay[] {
  const days: ParsedCampaignDay[] = [];
  
  // Extract timeline to determine year
  const timeline = extractTimeline(text);
  const baseYear = timeline ? new Date(timeline.startDate).getFullYear() : new Date().getFullYear();
  
  // Split by "Day X:" pattern
  const dayPattern = /Day\s+(\d+):\s*([^(]+)\s*\(([^)]+)\)/gi;
  const dayMatches = Array.from(text.matchAll(dayPattern));
  
  for (const match of dayMatches) {
    const dayNum = parseInt(match[1]);
    const title = match[2].trim();
    const dateStr = match[3].trim();
    
    // Find the content for this day (from this match to next match or end)
    const startIndex = match.index! + match[0].length;
    const nextMatch = dayMatches[dayMatches.indexOf(match) + 1];
    const endIndex = nextMatch ? nextMatch.index! : text.length;
    const dayContent = text.substring(startIndex, endIndex);
    
    // Parse date
    const date = parseDate(dateStr, baseYear);
    if (!date) continue;
    
    // Extract fields
    const focusMatch = dayContent.match(/\*\*Focus:\*\*\s*(.+?)(?:\n|$)/i);
    const focus = focusMatch ? focusMatch[1].trim() : '';
    
    const audienceMatch = dayContent.match(/\*\*Target Audience:\*\*\s*(.+?)(?:\n|$)/i);
    const targetAudience = audienceMatch ? audienceMatch[1].trim() : '';
    
    // Caption can be on multiple lines, extract everything between quotes
    const captionMatch = dayContent.match(/\*\*Caption:\*\*\s*"([^"]+(?:"[^"]+")*[^"]*)"|Caption:\s*"([^"]+(?:"[^"]+")*[^"]*)"/is);
    let caption = '';
    if (captionMatch) {
      caption = (captionMatch[1] || captionMatch[2] || '').replace(/\n/g, ' ').trim();
    } else {
      // Try without quotes
      const captionMatch2 = dayContent.match(/\*\*Caption:\*\*\s*(.+?)(?=\n\*\*|$)/is);
      if (captionMatch2) {
        caption = captionMatch2[1].trim();
      }
    }
    
    const visualMatch = dayContent.match(/\*\*Visual:\*\*\s*(.+?)(?=\n\*\*|\n\n|$)/is);
    const visual = visualMatch ? visualMatch[1].trim() : '';
    
    // CTA can be on multiple lines, extract everything between quotes
    const ctaMatch = dayContent.match(/\*\*CTA:\*\*\s*"([^"]+)"|CTA:\s*"([^"]+)"/is);
    let cta = '';
    if (ctaMatch) {
      cta = (ctaMatch[1] || ctaMatch[2] || '').replace(/\n/g, ' ').trim();
    } else {
      // Try without quotes
      const ctaMatch2 = dayContent.match(/\*\*CTA:\*\*\s*(.+?)(?=\n\*\*|\n\n|$)/is);
      if (ctaMatch2) {
        cta = ctaMatch2[1].trim();
      }
    }
    
    // Build content text
    const contentParts: string[] = [];
    if (focus) contentParts.push(`Focus: ${focus}`);
    if (targetAudience) contentParts.push(`Target Audience: ${targetAudience}`);
    if (caption) contentParts.push(`Caption: ${caption}`);
    if (visual) contentParts.push(`Visual: ${visual}`);
    if (cta) contentParts.push(`CTA: ${cta}`);
    
    const content = contentParts.join('\n\n');
    
    // Default to Instagram for social media campaigns
    const platform = 'instagram_post';
    
    days.push({
      date,
      title: title.length > 50 ? title.substring(0, 47) + '...' : title,
      content: content || title,
      platform,
      focus,
      targetAudience,
      caption,
      visual,
      cta,
    });
  }
  
  return days;
}
