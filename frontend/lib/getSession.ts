"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";

export async function getSession(): Promise<{ userId: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/login");
  try {
    const payload = verifyAccessToken(token);
    return { userId: payload.userId };
  } catch {
    redirect("/login");
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  redirect("/login");
}
