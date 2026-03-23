import { NextResponse } from "next/server";

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
  });

  return NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`
  );
}
