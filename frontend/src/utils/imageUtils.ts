/**
 * Get full image URL for display
 * In production, prepends backend URL if VITE_API_URL is set
 * In development, uses relative path (Vite proxy handles it)
 * For Google profile pictures, proxies through backend to avoid CORS and rate limiting
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '';
  
  // If it's a data URL (base64), return as is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // If it's a Google profile picture URL, proxy through backend to avoid CORS and rate limiting (429 errors)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    const isGoogleUrl = imagePath.includes('googleusercontent.com') || 
                       imagePath.includes('google.com') ||
                       imagePath.includes('googleapis.com');
    
    if (isGoogleUrl) {
      // Use backend proxy endpoint
      const BASE_API_URL = import.meta.env.VITE_API_URL || '';
      const proxyUrl = BASE_API_URL 
        ? `${BASE_API_URL}/api/upload/proxy-image?url=${encodeURIComponent(imagePath)}`
        : `/api/upload/proxy-image?url=${encodeURIComponent(imagePath)}`;
      return proxyUrl;
    }
    
    // For other external URLs, return as is
    return imagePath;
  }
  
  // In production, prepend backend URL if VITE_API_URL is set
  const BASE_API_URL = import.meta.env.VITE_API_URL || '';
  if (BASE_API_URL && imagePath.startsWith('/')) {
    return `${BASE_API_URL}${imagePath}`;
  }
  
  // Otherwise, use relative path (Vite proxy will handle it in development)
  return imagePath;
}

