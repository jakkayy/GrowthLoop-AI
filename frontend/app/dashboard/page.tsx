import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ScheduleForm from "./ScheduleForm";
import CompetitorsSection from "./CompetitorsSection";

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
      "user_id, full_name, email, brand_name, business_type, description, target, tone_brand, ci_color, market_goal, created_at, generate_time, post_time"
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

export default async function DashboardPage() {
  const user = await getUser();
  const [lineConn, fbConn, insights] = await Promise.all([
    getLineConnection(user.user_id),
    getFacebookConnection(user.user_id),
    getLatestInsights(user.user_id),
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
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 bg-white flex flex-col border-r border-gray-200">

        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div>
              <p className="text-gray-900 text-sm font-bold leading-tight">AXIS</p>
              <p className="text-[10px] text-green-600/70 tracking-widest">AI MARKETING</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {/* Overview — active */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700"
          >
            <span className="w-4 h-4 shrink-0"><GridIcon /></span>
            <span className="text-sm font-medium">Overview</span>
          </Link>
          {/* Connect Platform */}
          <Link
            href="/platform"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
          >
            <span className="w-4 h-4 shrink-0"><PlatformIcon /></span>
            <span className="text-sm">Connect Platform</span>
          </Link>
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-5 border-t border-gray-100 pt-4">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <span className="w-4 h-4 shrink-0"><LogoutIcon /></span>
              <span className="text-sm">Log Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0">
          <div className="flex-1">
            <h1 className="text-base font-semibold text-gray-900">Overview</h1>
          </div>
          {/* Search (decorative) */}
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 w-52">
            <SearchIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400">Search insights...</span>
          </div>
          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-5 overflow-y-auto">

          {/* Welcome Banner */}
          <div className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white relative overflow-hidden">
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-[60px]" />
            <div className="pointer-events-none absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-[40px]" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-green-100 bg-white/15 border border-white/25 px-2 py-0.5 rounded-full">
                      AI STRATEGY ACTIVE
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-white">คุณ {user.full_name}</h1>
                  <p className="text-xs text-green-100/80 mt-0.5">สมาชิกตั้งแต่ {joinedDate}</p>
                </div>
              </div>
              <button className="shrink-0 text-xs font-medium text-white/80 border border-white/20 rounded-xl px-4 py-2 hover:bg-white/10 transition-colors">
                แก้ไขโปรไฟล์
              </button>
            </div>
          </div>

          {/* 2-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

            {/* ── Left column ── */}
            <div className="lg:col-span-3 space-y-5">

              {/* Brand Identity */}
              <div className="rounded-2xl bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">ข้อมูลแบรนด์และอัตลักษณ์</h2>
                    <p className="text-xs text-gray-500 mt-0.5">กำหนดลักษณะของคอนเทนต์ตามแบรนด์ของคุณ</p>
                  </div>
                  <div className="h-7 w-7 rounded-lg bg-green-50 flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">ชื่อแบรนด์</p>
                    <p className="text-sm font-semibold text-gray-900">{user.brand_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">ประเภทธุรกิจ</p>
                    <p className="text-sm text-gray-700">{user.business_type || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Tone of Voice</p>
                    <span className="inline-block text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                      {user.tone_brand || "-"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Brand Palette</p>
                    <div className="flex items-center gap-2">
                      {user.ci_color?.startsWith("#") ? (
                        <>
                          <div
                            className="h-5 w-5 rounded-md border border-gray-200"
                            style={{ backgroundColor: user.ci_color }}
                          />
                          <span className="text-xs text-gray-600">{user.ci_color}</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-700">{user.ci_color || "-"}</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">กลุ่มเป้าหมาย</p>
                    <p className="text-sm text-gray-700">{user.target || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">เป้าหมายการตลาด</p>
                    <p className="text-sm text-gray-700">{user.market_goal || "-"}</p>
                  </div>
                </div>

                {/* Connected platforms */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">แพลตฟอร์มที่เชื่อมต่อ</p>
                  <div className="flex gap-2 flex-wrap">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${lineConn ? "bg-[#06C755]/10 border-[#06C755]/20 text-[#06C755]" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                      <span className="h-4 w-4 rounded bg-[#06C755] flex items-center justify-center text-white text-[9px] font-bold">L</span>
                      LINE OA · {lineConn ? lineConn.display_name : "ไม่ได้เชื่อมต่อ"}
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${fbConn ? "bg-[#1877F2]/10 border-[#1877F2]/20 text-[#4a9eff]" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                      <span className="h-4 w-4 rounded bg-[#1877F2] flex items-center justify-center text-white text-[9px] font-bold">f</span>
                      Facebook Page · {fbConn ? (fbConn.pages[0]?.page_name ?? "เชื่อมต่อแล้ว") : "ไม่ได้เชื่อมต่อ"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <ScheduleForm
                initialGenerateTime={user.generate_time ?? "06:00"}
                initialPostTime={user.post_time ?? "10:00"}
              />

              {/* Competitors */}
              <CompetitorsSection />
            </div>

            {/* ── Right column ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* AI Strategy Guidelines */}
              <div className="rounded-2xl bg-white border border-gray-200 p-6">
                <div className="mb-5">
                  <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full tracking-wide">
                    AI STRATEGY GUIDELINES
                  </span>
                  <h2 className="text-sm font-semibold text-gray-900 mt-2">แนวทางการทำ Content</h2>
                  <p className="text-xs text-gray-500 mt-0.5">วิเคราะห์จากข้อมูลคู่แข่ง · ใช้ใน prompt อัตโนมัติ</p>
                </div>

                {insightLines.length > 0 ? (
                  <div className="space-y-2.5">
                    {insightLines.map((line, i) => {
                      const num = String(i + 1).padStart(2, "0");
                      const colonIdx = line.indexOf(":");
                      const hasColon = colonIdx > 0 && colonIdx < 40;
                      const title = hasColon ? line.substring(0, colonIdx).trim() : line;
                      const desc = hasColon ? line.substring(colonIdx + 1).trim() : "";
                      return (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-xs font-bold text-green-600 shrink-0 mt-0.5 w-5">{num}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 leading-snug">{title}</p>
                            {desc && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">ยังไม่มีแนวทาง</p>
                    <p className="text-xs text-gray-400 mt-1">เพิ่มคู่แข่งแล้วกด Scrape Now<br />เพื่อให้ AI วิเคราะห์</p>
                  </div>
                )}
              </div>

              {/* Account info (compact) */}
              <div className="rounded-2xl bg-white border border-gray-200 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">ข้อมูลบัญชี</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">ชื่อ</span>
                    <span className="text-xs font-medium text-gray-700">{user.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">อีเมล</span>
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[160px]">{user.email}</span>
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

// ── Icons ──────────────────────────────────────────────────────────────────

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
    </svg>
  );
}
function PlatformIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3" width="14" height="10" rx="2" />
      <path d="M5 8h6M8 5v6" strokeLinecap="round" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
