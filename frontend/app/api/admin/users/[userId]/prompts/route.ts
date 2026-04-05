import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let role: string;
  try {
    const payload = verifyAccessToken(token);
    role = payload.role;
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  if (role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const { caption_system_prompt, image_prompt_prefix } =
    (await req.json()) as {
      caption_system_prompt?: string | null;
      image_prompt_prefix?: string | null;
    };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ caption_system_prompt, image_prompt_prefix })
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Prompts updated" });
}
