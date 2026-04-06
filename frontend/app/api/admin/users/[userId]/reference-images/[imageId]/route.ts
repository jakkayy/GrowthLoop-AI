import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

const BUCKET = "reference-images";

// DELETE — remove a reference image
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string; imageId: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { role } = verifyAccessToken(token);
    if (role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const { userId, imageId } = await params;
  const supabase = createAdminClient();

  const { data: row, error: fetchError } = await supabase
    .from("reference_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !row) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await supabase.storage.from(BUCKET).remove([row.storage_path]);

  const { error } = await supabase
    .from("reference_images")
    .delete()
    .eq("id", imageId);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "Deleted" });
}
