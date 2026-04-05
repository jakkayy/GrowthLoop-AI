import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let userId: string;
  try {
    const payload = verifyAccessToken(token);
    userId = payload.userId;
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const { plan } = await req.json() as { plan?: string };

  if (!plan || !["free", "pro", "enterprise"].includes(plan)) {
    return NextResponse.json({ message: "Invalid plan" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ plan })
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Plan updated", plan });
}
