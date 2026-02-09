/**
 * Get the correct OAuth redirect URL based on environment
 * Uses VITE_PRODUCTION_URL for production, falls back to localhost in dev
 */
export function getOAuthRedirectUrl(path: string = '/editor'): string {
  const productionUrl = import.meta.env.VITE_PRODUCTION_URL;

  // Use production URL if available and in production
  if (productionUrl && import.meta.env.PROD) {
    return `${productionUrl}${path}`;
  }

  // Development: use localhost
  if (import.meta.env.DEV) {
    return `http://localhost:5173${path}`;
  }

  // Fallback to window.location.origin
  return `${window.location.origin}${path}`;
}
