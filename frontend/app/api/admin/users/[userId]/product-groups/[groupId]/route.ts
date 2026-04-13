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

// DELETE — delete a product group (images become ungrouped)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string; groupId: string }> },
) {
  const role = await getAdminRole();
  if (role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { groupId } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("product_groups").delete().eq("id", groupId);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: "Deleted" });
}

// PATCH — rename a product group
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string; groupId: string }> },
) {
  const role = await getAdminRole();
  if (role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { groupId } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ message: "Name is required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_groups")
    .update({ name: name.trim() })
    .eq("id", groupId)
    .select("id, name, created_at")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}
