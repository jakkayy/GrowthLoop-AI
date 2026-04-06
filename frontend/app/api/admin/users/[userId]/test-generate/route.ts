import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
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

  const { userId } = await params;
  const { topic } = (await req.json()) as { topic?: string };

  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3001";
  const url = new URL(`${backendUrl}/test/preview`);
  url.searchParams.set("userId", userId);
  if (topic) url.searchParams.set("topic", topic);

  const res = await fetch(url.toString(), { method: "GET" });
  const data = await res.json();

  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json(data);
}
