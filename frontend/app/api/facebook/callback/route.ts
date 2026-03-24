import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAccessToken } from "@/lib/auth";

type FacebookMeResponse = {
  id: string;
  name: string;
};

type FacebookPage = {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  tasks?: string[];
};

type FacebookPagesResponse = {
  data?: FacebookPage[];
  error?: unknown;
};

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI!;

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

  // 1) แลก code เป็น user access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_secret=${appSecret}&code=${code}`
  );

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: "Token exchange failed", details: tokenData },
      { status: 400 }
    );
  }

  const userAccessToken: string = tokenData.access_token;

  // 2) ดึงข้อมูล user Facebook
  const meRes = await fetch(
    `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${userAccessToken}`
  );
  const meData = (await meRes.json()) as FacebookMeResponse;

  if (!meRes.ok || !meData.id) {
    return NextResponse.json(
      { error: "Failed to fetch Facebook user", details: meData },
      { status: 400 }
    );
  }

  // 3) ดึงรายชื่อเพจ
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`
  );
  const pagesData = (await pagesRes.json()) as FacebookPagesResponse;

  if (!pagesRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch pages", details: pagesData },
      { status: 400 }
    );
  }

  const pages = pagesData.data ?? [];

  // 4) ถ้า Facebook account นี้ถูก connect กับ user อื่น ให้ลบออกก่อน
  const { data: existingConn } = await supabase
    .from("facebook_connections")
    .select("user_id")
    .eq("facebook_user_id", meData.id)
    .neq("user_id", userId)
    .maybeSingle();

  if (existingConn) {
    await supabase
      .from("facebook_connections")
      .delete()
      .eq("facebook_user_id", meData.id)
      .neq("user_id", userId);
  }

  // upsert facebook_connections
  const { data: connectionRow, error: connectionError } = await supabase
    .from("facebook_connections")
    .upsert(
      {
        user_id: userId,
        facebook_user_id: meData.id,
        user_access_token: userAccessToken,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,facebook_user_id",
      }
    )
    .select("id")
    .single();

  if (connectionError || !connectionRow) {
    return NextResponse.json(
      { error: "Failed to save facebook connection", details: connectionError },
      { status: 500 }
    );
  }

  // 5) upsert facebook_pages
  if (pages.length > 0) {
    const pageRows = pages.map((page) => ({
      user_id: userId,
      facebook_connection_id: connectionRow.id,
      page_id: page.id,
      page_name: page.name,
      page_access_token: page.access_token,
      tasks: page.tasks ?? [],
      category: page.category ?? null,
      is_active: true,
      updated_at: new Date().toISOString(),
    }));

    const { error: pagesError } = await supabase
      .from("facebook_pages")
      .upsert(pageRows, {
        onConflict: "user_id,page_id",
      });

    if (pagesError) {
      return NextResponse.json(
        { error: "Failed to save facebook pages", details: pagesError },
        { status: 500 }
      );
    }
  }

  // 6) redirect กลับหน้า dashboard
  return NextResponse.redirect("http://localhost:3000/dashboard");
}