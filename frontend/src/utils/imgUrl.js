const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

/**
 * Resolves an image path from the database to a full URL.
 * Handles both legacy local paths (uploads/...) and full Cloudinary URLs (https://...).
 */
export function imgUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BACKEND}/${path}`;
}

export { BACKEND };
