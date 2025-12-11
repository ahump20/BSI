/**
 * BSI Transcript Worker - Serves video transcripts with chapters
 * Fetches VTT captions from Cloudflare Stream and converts to readable format
 */

const STREAM_ACCOUNT_ID = 'a12cb329d84130460eed99b816e4d0d3';
const VIDEO_UID = '138facaf760c65e9b4efab3715ae6f50';

// Video chapter definitions (timestamps in seconds)
// TODO: Update these after reviewing the transcript
const CHAPTERS = [
  { time: 0, title: "Introduction", description: "Setting the stage" },
  { time: 300, title: "AI in Sports Analytics", description: "How artificial intelligence is reshaping how we analyze performance" },
  { time: 900, title: "The CTE Crisis", description: "Understanding brain injuries in contact sports" },
  { time: 1500, title: "Psychedelics & Neuroregeneration", description: "Emerging research on brain repair" },
  { time: 2400, title: "The Future of Athlete Care", description: "Where science meets sports medicine" },
];

function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const cues = [];
  let currentCue = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip WEBVTT header and empty lines
    if (line === 'WEBVTT' || line === '' || line.startsWith('NOTE')) {
      continue;
    }
    
    // Check for timestamp line
    const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
    if (timestampMatch) {
      if (currentCue) {
        cues.push(currentCue);
      }
      currentCue = {
        start: timestampMatch[1],
        end: timestampMatch[2],
        startSeconds: timeToSeconds(timestampMatch[1]),
        text: ''
      };
      continue;
    }
    
    // Skip cue identifiers (numbers)
    if (/^\d+$/.test(line)) {
      continue;
    }
    
    // Add text to current cue
    if (currentCue && line) {
      currentCue.text += (currentCue.text ? ' ' : '') + line;
    }
  }
  
  if (currentCue) {
    cues.push(currentCue);
  }
  
  return cues;
}

function timeToSeconds(timeStr) {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
}

function secondsToTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function generatePlainTextTranscript(cues, chapters) {
  let output = `AI IN SPORTS & PSYCHEDELICS IN NEUROBIOLOGICAL REGENERATION
A Blaze Sports Intel Conversation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  // Group cues by chapter
  let chapterIndex = 0;
  let currentChapterCues = [];
  
  for (const cue of cues) {
    // Check if we've moved to a new chapter
    while (chapterIndex < chapters.length - 1 && 
           cue.startSeconds >= chapters[chapterIndex + 1].time) {
      // Output current chapter
      if (currentChapterCues.length > 0) {
        output += formatChapter(chapters[chapterIndex], currentChapterCues);
      }
      chapterIndex++;
      currentChapterCues = [];
    }
    currentChapterCues.push(cue);
  }
  
  // Output final chapter
  if (currentChapterCues.length > 0) {
    output += formatChapter(chapters[chapterIndex], currentChapterCues);
  }
  
  output += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
© 2025 Blaze Sports Intel | blazesportsintel.com
`;

  return output;
}

function formatChapter(chapter, cues) {
  let output = `
▸ ${chapter.title.toUpperCase()} [${secondsToTime(chapter.time)}]
  ${chapter.description}
───────────────────────────────────────────────────────────────

`;
  
  // Combine consecutive cues into paragraphs
  let paragraph = '';
  let paragraphStart = null;
  
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    
    if (!paragraphStart) {
      paragraphStart = cue.start;
    }
    
    paragraph += cue.text + ' ';
    
    // Create paragraph break on sentence endings or every ~200 chars
    if (cue.text.match(/[.!?]$/) || paragraph.length > 200) {
      output += `[${paragraphStart.substring(0, 8)}] ${paragraph.trim()}\n\n`;
      paragraph = '';
      paragraphStart = null;
    }
  }
  
  // Output remaining text
  if (paragraph.trim()) {
    output += `[${paragraphStart?.substring(0, 8) || ''}] ${paragraph.trim()}\n\n`;
  }
  
  return output;
}

function generateMarkdownTranscript(cues, chapters) {
  let output = `# AI in Sports & Psychedelics in Neurobiological Regeneration

**A Blaze Sports Intel Conversation**

---

## Table of Contents

`;

  // TOC
  for (const chapter of chapters) {
    const anchor = chapter.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    output += `- [${chapter.title}](#${anchor}) — ${secondsToTime(chapter.time)}\n`;
  }

  output += `\n---\n`;

  // Group cues by chapter (same logic as plain text)
  let chapterIndex = 0;
  let currentChapterCues = [];
  
  for (const cue of cues) {
    while (chapterIndex < chapters.length - 1 && 
           cue.startSeconds >= chapters[chapterIndex + 1].time) {
      if (currentChapterCues.length > 0) {
        output += formatMarkdownChapter(chapters[chapterIndex], currentChapterCues);
      }
      chapterIndex++;
      currentChapterCues = [];
    }
    currentChapterCues.push(cue);
  }
  
  if (currentChapterCues.length > 0) {
    output += formatMarkdownChapter(chapters[chapterIndex], currentChapterCues);
  }
  
  output += `\n---\n\n*© 2025 Blaze Sports Intel | [blazesportsintel.com](https://blazesportsintel.com)*\n`;

  return output;
}

function formatMarkdownChapter(chapter, cues) {
  const anchor = chapter.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  let output = `\n## ${chapter.title}

**${secondsToTime(chapter.time)}** — *${chapter.description}*

`;
  
  let paragraph = '';
  let paragraphStart = null;
  
  for (const cue of cues) {
    if (!paragraphStart) {
      paragraphStart = cue.start;
    }
    
    paragraph += cue.text + ' ';
    
    if (cue.text.match(/[.!?]$/) || paragraph.length > 200) {
      const timestamp = paragraphStart.substring(0, 8);
      output += `**[${timestamp}]** ${paragraph.trim()}\n\n`;
      paragraph = '';
      paragraphStart = null;
    }
  }
  
  if (paragraph.trim()) {
    output += `**[${paragraphStart?.substring(0, 8) || ''}]** ${paragraph.trim()}\n\n`;
  }
  
  return output;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Serve transcript endpoints
    if (path === '/transcript' || path === '/transcript.txt') {
      return await serveTranscript(env, 'text', corsHeaders);
    }
    
    if (path === '/transcript.md') {
      return await serveTranscript(env, 'markdown', corsHeaders);
    }
    
    if (path === '/transcript.vtt') {
      return await serveTranscript(env, 'vtt', corsHeaders);
    }
    
    if (path === '/chapters.json') {
      return new Response(JSON.stringify(CHAPTERS, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    }
    
    return new Response('Not found', { status: 404 });
  }
};

async function serveTranscript(env, format, corsHeaders) {
  try {
    // Fetch VTT from Cloudflare Stream API
    const vttUrl = `https://api.cloudflare.com/client/v4/accounts/${STREAM_ACCOUNT_ID}/stream/${VIDEO_UID}/captions/en/vtt`;
    
    const response = await fetch(vttUrl, {
      headers: {
        'Authorization': `Bearer ${env.CF_API_TOKEN}`,
      }
    });
    
    if (!response.ok) {
      // Return a placeholder if captions not available
      return new Response('Transcript not yet available. Captions are being generated.', {
        status: 503,
        headers: corsHeaders,
      });
    }
    
    const vttContent = await response.text();
    
    if (format === 'vtt') {
      return new Response(vttContent, {
        headers: {
          'Content-Type': 'text/vtt',
          'Content-Disposition': 'attachment; filename="bsi-ai-sports-psychedelics.vtt"',
          ...corsHeaders,
        }
      });
    }
    
    const cues = parseVTT(vttContent);
    
    if (format === 'markdown') {
      const markdown = generateMarkdownTranscript(cues, CHAPTERS);
      return new Response(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="bsi-ai-sports-psychedelics.md"',
          ...corsHeaders,
        }
      });
    }
    
    // Default: plain text
    const plainText = generatePlainTextTranscript(cues, CHAPTERS);
    return new Response(plainText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="bsi-ai-sports-psychedelics.txt"',
        ...corsHeaders,
      }
    });
    
  } catch (error) {
    return new Response(`Error generating transcript: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
}
