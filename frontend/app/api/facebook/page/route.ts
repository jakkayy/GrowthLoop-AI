import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // ชั่วคราว: เปลี่ยนเป็น user_id จริงจาก session ภายหลัง
  const TEST_USER_ID = "ใส่-user-id-ใน-db-ของคุณ";

  const { data, error } = await supabase
    .from("facebook_pages")
    .select("id, page_id, page_name, category, tasks, is_selected, is_active")
    .eq("user_id", TEST_USER_ID)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch pages", details: error },
      { status: 500 }
    );
  }

  return NextResponse.json({ pages: data });
}