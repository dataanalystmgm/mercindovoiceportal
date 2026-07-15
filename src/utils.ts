/**
 * Converts a standard Google Drive view/sharing link into a direct image/embed URL
 * that can be displayed inside standard <img> HTML elements.
 */
export const getGoogleDriveDirectUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  // Clean up whitespace or accidental quotes
  let cleanedUrl = url.trim().replace(/^['"]|['"]$/g, '');

  if (cleanedUrl.includes('drive.google.com')) {
    let id = '';
    
    // Pattern 1: /file/d/ID/view...
    const matchD = cleanedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) {
      id = matchD[1];
    } else {
      // Pattern 2: id=ID parameter (e.g. open?id=ID)
      const matchId = cleanedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        id = matchId[1];
      }
    }
    
    if (id) {
      // Return the direct display URL using googleusercontent which works beautifully inside <img> tags and iframes
      return `https://lh3.googleusercontent.com/d/${id}`;
    }
  }
  
  return cleanedUrl;
};
