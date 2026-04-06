import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

const BUCKET = "reference-images";

async function getAdminRole(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;
  try {
    return verifyAccessToken(token).role;
  } catch {
    return null;
  }
}

// GET — list reference images for a user
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const role = await getAdminRole();
  if (role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reference_images")
    .select("id, image_url, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — upload a reference image
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const role = await getAdminRole();
  if (role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ message: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${userId}/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const supabase = createAdminClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ message: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const { data, error: dbError } = await supabase
    .from("reference_images")
    .insert({ user_id: userId, image_url: publicUrl, storage_path: storagePath })
    .select("id, image_url, created_at")
    .single();

  if (dbError) return NextResponse.json({ message: dbError.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
