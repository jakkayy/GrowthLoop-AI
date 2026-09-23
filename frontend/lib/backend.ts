/**
 * Server-only helper for calling the internal NestJS backend.
 *
 * The backend trusts these calls purely because they carry
 * INTERNAL_API_KEY — it never sees the end user's session. Callers must
 * verify the caller's JWT and pass a userId they already trust *before*
 * using this helper. Never call this from a Client Component.
 */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export function backendFetch(path: string, init: RequestInit = {}) {
  if (!INTERNAL_API_KEY) {
    throw new Error(
      "Missing INTERNAL_API_KEY env var — required to call the backend."
    );
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "x-internal-api-key": INTERNAL_API_KEY,
    },
  });
}
