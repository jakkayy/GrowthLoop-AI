import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let userId: string;
    try {
      const payload = verifyAccessToken(token);
      userId = payload.userId;
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { generate_time, post_time } = (await req.json()) as {
      generate_time?: string;
      post_time?: string;
    };

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!generate_time || !post_time || !timeRegex.test(generate_time) || !timeRegex.test(post_time)) {
      return NextResponse.json({ message: "รูปแบบเวลาไม่ถูกต้อง" }, { status: 400 });
    }

    const { error } = await supabase
      .from("users")
      .update({ generate_time, post_time })
      .eq("user_id", userId);

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    return NextResponse.json({ message: "บันทึกสำเร็จ" });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
