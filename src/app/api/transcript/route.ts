import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, getThumbnailUrl } from '@/lib/youtube';

// Helper to fetch with an absolute timeout limit (in ms) to avoid infinite hangs
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// O(N) bracket-balancing balancer that extracts JSON objects, 100% immune to ReDoS catastrophic backtracking
function extractJsonFromString(text: string, marker: string): string | null {
  const markerIndex = text.indexOf(marker);
  if (markerIndex === -1) return null;

  // Find the first opening brace after the marker
  const braceIndex = text.indexOf('{', markerIndex + marker.length);
  if (braceIndex === -1) return null;

  let openBraces = 0;
  let inString = false;
  let escapeNext = false;
  let result = '';

  for (let i = braceIndex; i < text.length; i++) {
    const char = text[i];
    result += char;

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        openBraces++;
      } else if (char === '}') {
        openBraces--;
        if (openBraces === 0) {
          return result;
        }
      }
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return NextResponse.json({ error: 'Missing YouTube video URL' }, { status: 400 });
  }

  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL or Video ID' }, { status: 400 });
  }

  // Define default values
  let title = 'YouTube Video';
  let author = 'Unknown Channel';
  let transcriptText = '';
  const thumbnailUrl = getThumbnailUrl(videoId);
  const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}&hl=en&persist_hl=1`;

  // 1. Fetch metadata from YouTube Page first (always reliable for details)
  let captionTracks: any[] = [];
  try {
    const response = await fetchWithTimeout(videoPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+429;',
      },
      next: { revalidate: 3600 }
    } as any, 20000); // 20 seconds timeout to avoid hangs

    if (response.ok) {
      const html = await response.text();
      const playerResponseJson = extractJsonFromString(html, 'ytInitialPlayerResponse');

      if (playerResponseJson) {
        try {
          const playerResponse = JSON.parse(playerResponseJson);
          title = playerResponse?.videoDetails?.title || title;
          author = playerResponse?.videoDetails?.author || author;
          captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
        } catch (e) {
          console.error('Failed to parse player response JSON', e);
        }
      }

      if (title === 'YouTube Video') {
        const metaTitleMatch = html.match(/<meta name="title" content="([^"]+)"/);
        if (metaTitleMatch) {
          title = decodeHtml(metaTitleMatch[1]);
        }
      }
    }
  } catch (err) {
    console.warn('Metadata scrape failed, continuing anyway:', err);
  }

  // 2. PRIMARY STRATEGY: Native subtitle scraping and XML parsing
  let apiSuccess = false;
  if (captionTracks && captionTracks.length > 0) {
    try {
      const englishTrack = captionTracks.find(track => track.languageCode === 'en') || captionTracks[0];
      const transcriptUrl = englishTrack.baseUrl;

      if (transcriptUrl) {
        const transcriptResponse = await fetchWithTimeout(transcriptUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        }, 20000); // 20 seconds timeout to avoid hangs

        if (transcriptResponse.ok) {
          const xmlText = await transcriptResponse.text();
          const lines: string[] = [];

          // Try standard <text> matching
          const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
          let textMatch;
          while ((textMatch = textRegex.exec(xmlText)) !== null) {
            const cleanLine = decodeHtml(textMatch[1])
              .replace(/[\r\n]+/g, ' ')
              .trim();
            if (cleanLine) {
              lines.push(cleanLine);
            }
          }

          // Try fallback: <p> matching (TTML format)
          if (lines.length === 0) {
            const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
            let pMatch;
            while ((pMatch = pRegex.exec(xmlText)) !== null) {
              const cleanP = decodeHtml(pMatch[1].replace(/<[^>]*>/g, ''))
                .replace(/[\r\n]+/g, ' ')
                .trim();
              if (cleanP) {
                lines.push(cleanP);
              }
            }
          }

          // Try fallback: strip all XML tags entirely
          if (lines.length === 0) {
            const cleanText = xmlText
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            if (cleanText) {
              lines.push(decodeHtml(cleanText));
            }
          }

          transcriptText = lines.join(' ');
          apiSuccess = transcriptText.trim().length > 0;
        }
      }
    } catch (fallbackErr) {
      console.error('Fallback parser failed:', fallbackErr);
    }
  }

  // 3. SECONDARY STRATEGY: Direct timedtext fallback (Queries Google's subtitles endpoint directly)
  if (!apiSuccess || !transcriptText || transcriptText.trim() === '') {
    try {
      const directUrl = `https://video.google.com/timedtext?v=${videoId}&lang=en`;
      const directResponse = await fetchWithTimeout(directUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      }, 10000);

      if (directResponse.ok) {
        const xmlText = await directResponse.text();
        if (xmlText && xmlText.trim().length > 0 && !xmlText.includes('Error')) {
          const lines: string[] = [];
          const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
          let textMatch;
          while ((textMatch = textRegex.exec(xmlText)) !== null) {
            const cleanLine = decodeHtml(textMatch[1])
              .replace(/[\r\n]+/g, ' ')
              .trim();
            if (cleanLine) {
              lines.push(cleanLine);
            }
          }
          if (lines.length > 0) {
            transcriptText = lines.join(' ');
            apiSuccess = true;
          }
        }
      }
    } catch (directErr) {
      console.warn('Direct timedtext fallback failed:', directErr);
    }
  }

  // 4. TERTIARY STRATEGY: Try youtube-transcript.ai (Free public proxy mirror API)
  if (!apiSuccess || !transcriptText || transcriptText.trim() === '') {
    try {
      const mirrorRes = await fetchWithTimeout(`https://youtube-transcript.ai/transcript/${videoId}.txt`, {
        headers: {
          'Accept': 'text/plain,application/json'
        }
      }, 8000);

      if (mirrorRes.ok) {
        const rawText = await mirrorRes.text();
        if (rawText && rawText.trim().length > 0) {
          // Clean timestamps like [00:00], [00:00:00], 00:00, or any markdown timestamps
          const cleanedText = rawText
            .replace(/\[\d{2}:\d{2}(:\d{2})?\]/g, '') // remove [00:00] or [00:00:00]
            .replace(/\b\d{2}:\d{2}(:\d{2})?\b/g, '') // remove raw 00:00 or 00:00:00
            .replace(/[\r\n]+/g, ' ') // join lines
            .replace(/\s+/g, ' ') // compress spaces
            .trim();

          if (cleanedText.length > 0) {
            transcriptText = cleanedText;
            apiSuccess = true;
          }
        }
      }
    } catch (mirrorErr) {
      console.warn('Mirror fallback parser failed:', mirrorErr);
    }
  }

  // 4. Return results or display error if both pipelines failed
  if (!transcriptText || transcriptText.trim() === '') {
    return NextResponse.json({
      success: false,
      error: 'Transcript could not be retrieved from YouTube or API endpoints.',
      videoId,
      videoTitle: title,
      channelName: author,
      thumbnailUrl,
    });
  }

  return NextResponse.json({
    success: true,
    videoId,
    videoTitle: title,
    channelName: author,
    thumbnailUrl,
    transcriptText,
  });
}

// Simple HTML entity decoding helper
function decodeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&apos;/g, "'");
}
