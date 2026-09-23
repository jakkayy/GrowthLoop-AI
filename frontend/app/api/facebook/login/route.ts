import { NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE_MAX_AGE_SECONDS } from "@/lib/oauth-state";

export async function GET() {
  const appId = process.env.FACEBOOK_APP_ID!;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI!;

  const state = crypto.randomUUID();
  const scope = [
    "pages_show_list",
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_manage_metadata",
    "pages_manage_engagement",
  ].join(",");

  const url =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&auth_type=rerequest`;

  const response = NextResponse.redirect(url);
  // Stored so the callback can confirm the code it receives really came
  // from a flow *we* started, not an attacker's own OAuth flow replayed
  // against a logged-in victim (CSRF / account-linking confusion).
  response.cookies.set("fb_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}