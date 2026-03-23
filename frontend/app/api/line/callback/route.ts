import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAccessToken } from "@/lib/auth";

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

  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
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

  // 3) เช็คว่า LINE account นี้ถูก connect กับ user อื่นอยู่หรือเปล่า
  const { data: existing } = await supabase
    .from("line_connections")
    .select("user_id")
    .eq("line_user_id", profile.userId)
    .single();

  if (existing && existing.user_id !== userId) {
    // LINE account นี้ถูกใช้กับ user อื่นแล้ว — ย้าย ownership มาให้ user ปัจจุบัน
    await supabase
      .from("line_connections")
      .delete()
      .eq("line_user_id", profile.userId);
  }

  // upsert line_connections
  const { error: upsertError } = await supabase
    .from("line_connections")
    .upsert(
      {
        user_id: userId,
        line_user_id: profile.userId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl ?? null,
        access_token: lineAccessToken,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    return NextResponse.json(
      { error: "Failed to save LINE connection", details: upsertError },
      { status: 500 }
    );
  }

  // 4) redirect กลับหน้า platform
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/platform`);
}
