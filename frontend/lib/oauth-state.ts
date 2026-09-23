// OAuth state cookies only need to survive the round trip to the
// provider's consent screen and back — 10 minutes is generous.
export const OAUTH_STATE_COOKIE_MAX_AGE_SECONDS = 10 * 60;
