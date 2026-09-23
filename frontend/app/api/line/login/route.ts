import { NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE_MAX_AGE_SECONDS } from "@/lib/oauth-state";

export async function GET() {
  const clientId = process.env.LINE_CLIENT_ID!;
  const redirectUri = process.env.LINE_REDIRECT_URI!;

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "profile openid",
    nonce,
    prompt: "consent login",
    bot_prompt: "aggressive",
  });

  const response = NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`
  );
  // Stored so the callback can confirm the code it receives really came
  // from a flow *we* started, not an attacker's own OAuth flow replayed
  // against a logged-in victim (CSRF / account-linking confusion).
  response.cookies.set("line_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
