import { NextResponse } from "next/server";

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

  return NextResponse.redirect(url);
}