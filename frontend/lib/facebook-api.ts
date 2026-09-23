// Single source of truth for which Facebook Graph API version the
// frontend targets. Previously v19.0 was hardcoded directly into four
// separate URLs here, ignoring the FACEBOOK_API_VERSION env var that was
// already configured (and used by the backend, with its own separate
// default — see backend/src/facebook/facebook-api.config.ts).
export const FACEBOOK_API_VERSION = process.env.FACEBOOK_API_VERSION || "v19.0";

export function facebookGraphUrl(path: string): string {
  return `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${path}`;
}
