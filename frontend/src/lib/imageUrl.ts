/**
 * Universal helper to get the correct URL for images stored on the backend or ImageKit.
 * Fallbacks appropriately for legacy local files or external absolute links.
 */
export function getImageUrl(path: string | null | undefined, transformations: string = ''): string {
  if (!path) return '';
  
  // If the path is already a full URL (including Razorpay tokens, data blobs, external domains)
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  
  // Provide seamless backwards compatibility for old /uploads/ data
  let cleanPath = path.replace(/^\/+/, '');
  if (cleanPath.startsWith('uploads/')) {
    const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
    return `${backendBase}/${cleanPath}`;
  }

  // Modern ImageKit handling (with transformation queries capability)
  const imageKitBase = (process.env.NEXT_PUBLIC_IMAGEKIT_URL || 'https://ik.imagekit.io/l4hvfuzzvo').replace(/\/+$/, '');
  
  if (transformations) {
    return `${imageKitBase}/${cleanPath}?tr=${transformations}`;
  }

  return `${imageKitBase}/${cleanPath}`;
}
