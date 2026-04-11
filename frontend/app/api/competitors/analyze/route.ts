import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";

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

  const { supabase } = await import("@/lib/supabase");
  const { data, error } = await supabase
    .from("competitor_insights")
    .select("content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ content: data?.content ?? null, created_at: data?.created_at ?? null });
}

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = getUserId(token);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  const res = await fetch(`${backendUrl}/competitors/analyze?userId=${userId}`, {
    method: "POST",
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ message: data?.message ?? "Analysis failed" }, { status: res.status });
  }

  return NextResponse.json(data);
}
