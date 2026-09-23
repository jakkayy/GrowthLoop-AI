import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { backendFetch } from "@/lib/backend";

function getUserId(token: string): string | null {
  try {
    return verifyAccessToken(token).userId;
  } catch {
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = getUserId(token);
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id: competitorId } = await params;
  const { pageUrl } = (await req.json()) as { pageUrl: string };

  const res = await backendFetch(`/competitors/${competitorId}/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, pageUrl }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ message: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
