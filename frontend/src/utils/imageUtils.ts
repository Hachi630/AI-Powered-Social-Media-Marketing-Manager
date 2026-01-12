/**
 * Get full image URL for display
 * In production, prepends backend URL if VITE_API_URL is set
 * In development, uses relative path (Vite proxy handles it)
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a data URL (base64), return as is
  if (imagePath.startsWith('data:')) {
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

