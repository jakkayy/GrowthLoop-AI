import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

// Service-role client: this route already verifies the caller's JWT
// before touching the DB, so bypassing RLS here is intentional — the
// anon key must never be trusted with reads/writes on user data.
const supabase = createAdminClient();

function getUserId(token: string): string | null {
  try {
    return verifyAccessToken(token).userId;
  } catch {
    return null;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = getUserId(token);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("competitors")
    .select(
      "id, page_url, page_name, created_at, competitor_scrape_jobs(id, status, posts_count, result_url, started_at, completed_at)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = getUserId(token);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { pageUrl, pageName } = (await req.json()) as {
    pageUrl?: string;
    pageName?: string;
  };

  if (!pageUrl || !pageName) {
    return NextResponse.json({ message: "pageUrl and pageName are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("competitors")
    .insert({ user_id: userId, page_url: pageUrl, page_name: pageName })
    .select("id")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
