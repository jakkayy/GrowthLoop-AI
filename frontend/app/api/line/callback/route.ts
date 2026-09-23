import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { verifyAccessToken } from "@/lib/auth";

// Service-role client: this route already verifies the caller's JWT
// before touching the DB, and it stores a LINE OAuth access token, which
// must never be reachable via the public anon key.
const supabase = createAdminClient();

type LineTokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  id_token?: string;
};

type LineProfileResponse = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get("line_oauth_state")?.value;

  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  // Reject unless this callback matches a flow *we* started via
  // /api/line/login — otherwise an attacker's own OAuth code could be
  // replayed against a logged-in victim to link the attacker's LINE
  // account to the victim's account (CSRF / account-linking confusion).
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.json({ error: "Invalid or missing state" }, { status: 400 });
  }

  // ดึง user_id จาก JWT cookie
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;
  try {
    const payload = verifyAccessToken(token);
    userId = payload.userId;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const clientId = process.env.LINE_CLIENT_ID!;
  const clientSecret = process.env.LINE_CLIENT_SECRET!;
  const redirectUri = process.env.LINE_REDIRECT_URI!;

  // 1) แลก code เป็น access token
  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const tokenData = (await tokenRes.json()) as LineTokenResponse;

  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: "Token exchange failed", details: tokenData },
      { status: 400 }
    );
  }

  const lineAccessToken = tokenData.access_token;

  // 2) ดึงข้อมูล profile LINE
  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${lineAccessToken}` },
  });

  const profile = (await profileRes.json()) as LineProfileResponse;

  if (!profileRes.ok || !profile.userId) {
    return NextResponse.json(
      { error: "Failed to fetch LINE profile", details: profile },
      { status: 400 }
    );
  }

  // 3) ลบ connections เก่าทั้งหมด (ทั้งของ user นี้ และ LINE account นี้ที่อาจอยู่กับ user อื่น)
  await supabase
    .from("line_connections")
    .delete()
    .eq("user_id", userId);

  await supabase
    .from("line_connections")
    .delete()
    .eq("line_user_id", profile.userId);

  // insert connection ใหม่เพียงอันเดียว
  const { error: upsertError } = await supabase
    .from("line_connections")
    .insert({
      user_id: userId,
      line_user_id: profile.userId,
      display_name: profile.displayName,
      picture_url: profile.pictureUrl ?? null,
      access_token: lineAccessToken,
      status: "active",
      updated_at: new Date().toISOString(),
    });

  if (upsertError) {
    return NextResponse.json(
      { error: "Failed to save LINE connection", details: upsertError },
      { status: 500 }
    );
  }

  // 4) redirect กลับหน้า platform
  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/platform`);
  response.cookies.delete("line_oauth_state"); // one-time use
  return response;
}
