/**
 * Extracts the 11-character YouTube video ID from various YouTube URL formats.
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;
  
  // If it's already a clean 11-char ID
  const cleanIdPattern = /^[a-zA-Z0-9_-]{11}$/;
  const trimmed = url.trim();
  if (cleanIdPattern.test(trimmed)) {
    return trimmed;
  }
  
  // Various patterns for YouTube URLs
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /youtube\.com\/live\/([^"&?\/\s]{11})/i,
    /youtube\.com\/shorts\/([^"&?\/\s]{11})/i
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Returns a high-quality thumbnail URL for a given video ID.
 */
export function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
