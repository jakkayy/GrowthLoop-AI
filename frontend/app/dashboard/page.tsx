import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import UserSidebar from "@/components/UserSidebar";
import ScheduleForm from "./ScheduleForm";
import CompetitorsSection from "./CompetitorsSection";
import OwnPageInsightsSection from "./OwnPageInsightsSection";
import ReferenceImages from "./ReferenceImages";

async function logout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  redirect("/login");
}

type User = {
  user_id: string;
  full_name: string;
  email: string;
  brand_name: string;
  business_type: string;
  description: string;
  target: string;
  tone_brand: string;
  ci_color: string;
  market_goal: string;
  created_at: string;
  generate_time: string;
  post_time: string;
  report_time: string | null;
};

type LineConnection = {
  line_user_id: string;
  display_name: string;
  picture_url: string | null;
  status: string;
};

type FacebookPage = {
  page_id: string;
  page_name: string;
  category: string | null;
  is_active: boolean;
};

type FacebookConnection = {
  facebook_user_id: string;
  status: string;
  pages: FacebookPage[];
};

async function getUser(): Promise<User> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/login");

  let userId: string;
  try {
    const payload = verifyAccessToken(token);
    userId = payload.userId;
  } catch {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("users")
    .select(
      "user_id, full_name, email, brand_name, business_type, description, target, tone_brand, ci_color, market_goal, created_at, generate_time, post_time, report_time"
    )
    .eq("user_id", userId)
    .single();

  if (error || !data) redirect("/login");
  return data as User;
}

async function getLatestInsights(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("competitor_insights")
    .select("content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data?.content ?? null;
}

async function getLineConnection(userId: string): Promise<LineConnection | null> {
  const { data } = await supabase
    .from("line_connections")
    .select("line_user_id, display_name, picture_url, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();
  return data ?? null;
}

async function getFacebookConnection(userId: string): Promise<FacebookConnection | null> {
  const { data: conn } = await supabase
    .from("facebook_connections")
    .select("facebook_user_id, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!conn) return null;

  const { data: pages } = await supabase
    .from("facebook_pages")
    .select("page_id, page_name, category, is_active")
    .eq("user_id", userId);

  return { ...conn, pages: pages ?? [] };
}

async function getProductGroups(userId: string) {
  const { data } = await supabase
    .from("product_groups")
    .select("id, name, created_at, reference_images(id, image_url, created_at, group_id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

async function getUngroupedImages(userId: string) {
  const { data } = await supabase
    .from("reference_images")
    .select("id, image_url, created_at, group_id")
    .eq("user_id", userId)
    .is("group_id", null)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export default async function DashboardPage() {
  const user = await getUser();
  const [lineConn, fbConn, insights, productGroups, ungroupedImages] = await Promise.all([
    getLineConnection(user.user_id),
    getFacebookConnection(user.user_id),
    getLatestInsights(user.user_id),
    getProductGroups(user.user_id),
    getUngroupedImages(user.user_id),
  ]);

  const joinedDate = new Date(user.created_at).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const insightLines = insights
    ? insights.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.replace(/^[-•*\d.]+\s*/, ""))
    : [];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <UserSidebar activePage="overview" logoutAction={logout} />

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-6 gap-4 shrink-0">
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-zinc-200 tracking-tight">Overview</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 w-52">
            <SearchIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-[15px] text-zinc-600">Search insights...</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-5 overflow-y-auto">

          {/* Welcome Banner */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 via-zinc-900 to-indigo-600/15 border border-violet-500/20 p-6 text-white relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-violet-500/10 blur-[50px]" />
            <div className="pointer-events-none absolute left-1/2 -bottom-6 h-36 w-36 rounded-full bg-indigo-500/10 blur-[40px]" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-violet-500/15 backdrop-blur-sm border border-violet-500/20 flex items-center justify-center text-violet-300 text-xl font-bold shrink-0">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-violet-400 bg-violet-500/15 border border-violet-500/20 px-2.5 py-0.5 rounded-full tracking-widest uppercase">
                      AI Strategy Active
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-zinc-50 leading-tight">คุณ {user.full_name}</h1>
                  <p className="text-sm text-zinc-500 mt-0.5">สมาชิกตั้งแต่ {joinedDate}</p>
                </div>
              </div>
              <button className="shrink-0 text-sm font-medium text-zinc-400 border border-zinc-700 rounded-xl px-4 py-2 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
                แก้ไขโปรไฟล์
              </button>
            </div>
          </div>

          {/* 2-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

            {/* ── Left column ── */}
            <div className="lg:col-span-3 space-y-5">

              {/* Brand Identity */}
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-50">ข้อมูลแบรนด์และอัตลักษณ์</h2>
                    <p className="text-[15px] text-zinc-500 mt-0.5">กำหนดลักษณะของคอนเทนต์ตามแบรนด์ของคุณ</p>
                  </div>
                  <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8l3.5 3.5L13 4.5" />
                    </svg>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">ชื่อแบรนด์</p>
                    <p className="text-base font-semibold text-zinc-50">{user.brand_name || "-"}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">ประเภทธุรกิจ</p>
                    <p className="text-[15px] text-zinc-300">{user.business_type || "-"}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Tone of Voice</p>
                    <span className="inline-block text-sm font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-lg">
                      {user.tone_brand || "-"}
                    </span>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Brand Palette</p>
                    <div className="flex items-center gap-2">
                      {user.ci_color?.startsWith("#") ? (
                        <>
                          <div
                            className="h-5 w-5 rounded-lg border border-zinc-700"
                            style={{ backgroundColor: user.ci_color }}
                          />
                          <span className="text-sm font-medium text-zinc-400">{user.ci_color}</span>
                        </>
                      ) : (
                        <span className="text-[15px] text-zinc-300">{user.ci_color || "-"}</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-3 col-span-2">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">กลุ่มเป้าหมาย</p>
                    <p className="text-[15px] text-zinc-300">{user.target || "-"}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-3 col-span-2">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">เป้าหมายการตลาด</p>
                    <p className="text-[15px] text-zinc-300">{user.market_goal || "-"}</p>
                  </div>
                </div>

                {/* Connected platforms */}
                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">แพลตฟอร์มที่เชื่อมต่อ</p>
                  <div className="flex gap-2 flex-wrap">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${lineConn ? "bg-[#06C755]/8 border-[#06C755]/20 text-[#06C755]" : "bg-zinc-800 border-zinc-700 text-zinc-500"}`}>
                      <span className="h-4 w-4 rounded-md bg-[#06C755] flex items-center justify-center text-white text-[9px] font-bold">L</span>
                      LINE OA · {lineConn ? lineConn.display_name : "ไม่ได้เชื่อมต่อ"}
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${fbConn ? "bg-[#1877F2]/8 border-[#1877F2]/15 text-[#4a9eff]" : "bg-zinc-800 border-zinc-700 text-zinc-500"}`}>
                      <span className="h-4 w-4 rounded-md bg-[#1877F2] flex items-center justify-center text-white text-[9px] font-bold">f</span>
                      Facebook Page · {fbConn ? (fbConn.pages[0]?.page_name ?? "เชื่อมต่อแล้ว") : "ไม่ได้เชื่อมต่อ"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <ScheduleForm
                initialGenerateTime={user.generate_time ?? "06:00"}
                initialPostTime={user.post_time ?? "10:00"}
                initialReportTime={user.report_time ?? "20:00"}
              />

              {/* Own Page Insights */}
              <OwnPageInsightsSection />

              {/* Competitors */}
              <CompetitorsSection />
            </div>

            {/* ── Right column ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* AI Strategy Guidelines */}
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
                <div className="mb-5">
                  <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full tracking-widest uppercase">
                    AI Strategy Guidelines
                  </span>
                  <h2 className="text-base font-semibold text-zinc-50 mt-2.5">แนวทางการทำ Content</h2>
                  <p className="text-[15px] text-zinc-500 mt-0.5">วิเคราะห์จากข้อมูลคู่แข่ง · ใช้ใน prompt อัตโนมัติ</p>
                </div>

                {insightLines.length > 0 ? (
                  <div className="space-y-2">
                    {insightLines.map((line, i) => {
                      const num = String(i + 1).padStart(2, "0");
                      const colonIdx = line.indexOf(":");
                      const hasColon = colonIdx > 0 && colonIdx < 40;
                      const title = hasColon ? line.substring(0, colonIdx).trim() : line;
                      const desc = hasColon ? line.substring(colonIdx + 1).trim() : "";
                      return (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-violet-500/30 transition-colors">
                          <span className="text-sm font-bold text-violet-400 shrink-0 mt-0.5 w-5 leading-tight">{num}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-200 leading-snug">{title}</p>
                            {desc && <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-500">ยังไม่มีแนวทาง</p>
                    <p className="text-[13px] text-zinc-600 mt-1">เพิ่มคู่แข่งแล้วกด Scrape Now<br />เพื่อให้ AI วิเคราะห์</p>
                  </div>
                )}
              </div>

              {/* Reference Images */}
              <ReferenceImages initialGroups={productGroups} initialUngrouped={ungroupedImages} />

              {/* Account info (compact) */}
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
                <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">ข้อมูลบัญชี</h2>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] text-zinc-500">ชื่อ</span>
                    <span className="text-sm font-medium text-zinc-300">{user.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] text-zinc-500">อีเมล</span>
                    <span className="text-sm font-medium text-zinc-300 truncate max-w-[160px]">{user.email}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5l3 3" strokeLinecap="round" />
    </svg>
  );
}
