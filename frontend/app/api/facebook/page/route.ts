import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

// Service-role client: this route already verifies the caller's JWT
// before touching the DB, so bypassing RLS here is intentional.
const supabase = createAdminClient();

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let userId: string;
  try {
    userId = verifyAccessToken(token).userId;
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("facebook_pages")
    .select("id, page_id, page_name, category, tasks, is_selected, is_active")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch pages", details: error },
      { status: 500 }
    );
  }

  return NextResponse.json({ pages: data });
}