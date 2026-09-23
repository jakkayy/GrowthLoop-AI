import { ConfigService } from '@nestjs/config';

/**
 * Single source of truth for which Facebook Graph API version the backend
 * targets. Previously this default ('v19.0') was copy-pasted into three
 * services independently — easy to update one and forget the others,
 * and out of sync with the frontend, which had v19.0 hardcoded with no
 * env var at all (see FACEBOOK_API_VERSION usage in
 * frontend/app/api/facebook/callback/route.ts).
 */
export const DEFAULT_FACEBOOK_API_VERSION = 'v19.0';

export function resolveFacebookApiVersion(config: ConfigService): string {
  return (
    config.get<string>('FACEBOOK_API_VERSION') || DEFAULT_FACEBOOK_API_VERSION
  );
}
