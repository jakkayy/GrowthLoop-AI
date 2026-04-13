import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

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

// GET — list product groups with images for a user
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const role = await getAdminRole();
  if (role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_groups")
    .select("id, name, created_at, reference_images(id, image_url, created_at, group_id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — create a product group for a user
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const role = await getAdminRole();
  if (role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ message: "Name is required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_groups")
    .insert({ user_id: userId, name: name.trim() })
    .select("id, name, created_at")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ...data, reference_images: [] }, { status: 201 });
}
