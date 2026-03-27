import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ScheduleForm from "./ScheduleForm";

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800">{value || "-"}</span>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getUser();
  const [lineConn, fbConn] = await Promise.all([
    getLineConnection(user.user_id),
    getFacebookConnection(user.user_id),
  ]);

  const joinedDate = new Date(user.created_at).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-3xl space-y-5">

        {/* Navbar */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-green-100 px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-base font-bold text-gray-900">AXIS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/platform"
              className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Platform →
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                logout
              </button>
            </form>
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white relative overflow-hidden">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-[60px]" />
          <div className="relative z-10">
            <p className="text-green-100 text-sm mb-1">สวัสดี 👋</p>
            <h1 className="text-2xl font-bold">{user.full_name}</h1>
            <p className="text-green-200 text-xs mt-1">สมาชิกตั้งแต่ {joinedDate}</p>
          </div>
        </div>

        {/* Account Card */}
        <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">ข้อมูลบัญชี</h2>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="ชื่อ" value={user.full_name} />
            <InfoRow label="อีเมล" value={user.email} />
          </div>
        </div>

        {/* Brand Card */}
        <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">ข้อมูลแบรนด์</h2>
          <div className="grid grid-cols-2 gap-5">
            <InfoRow label="ชื่อแบรนด์" value={user.brand_name} />
            <InfoRow label="ประเภทธุรกิจ" value={user.business_type} />
            <div className="col-span-2">
              <InfoRow label="คำอธิบายธุรกิจ" value={user.description} />
            </div>
            <div className="col-span-2">
              <InfoRow label="กลุ่มเป้าหมาย" value={user.target} />
            </div>
            <InfoRow label="โทนแบรนด์" value={user.tone_brand} />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">สี CI / Brand Identity</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border border-gray-200 shadow-sm"
                  style={{ backgroundColor: user.ci_color.startsWith("#") ? user.ci_color : undefined }}
                />
                <span className="text-sm text-gray-800">{user.ci_color || "-"}</span>
              </div>
            </div>
            <InfoRow label="เป้าหมายการตลาด" value={user.market_goal} />
          </div>
        </div>

        {/* Platforms Card */}
        <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">แพลตฟอร์มที่เชื่อมต่อ</h2>
          <div className="space-y-3">
            {/* LINE */}
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 hover:border-green-200 hover:bg-green-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#06C755] text-white text-sm font-bold shadow-sm">
                  L
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">LINE</p>
                  {lineConn ? (
                    <p className="text-xs text-gray-500">{lineConn.display_name}</p>
                  ) : (
                    <p className="text-xs text-gray-400">ยังไม่ได้เชื่อมต่อ</p>
                  )}
                </div>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${lineConn ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {lineConn ? "เชื่อมต่อแล้ว" : "ไม่ได้เชื่อมต่อ"}
              </span>
            </div>

            {/* Facebook */}
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 hover:border-green-200 hover:bg-green-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2] text-white text-sm font-bold shadow-sm">
                  f
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Facebook</p>
                  {fbConn ? (
                    <p className="text-xs text-gray-500">
                      {fbConn.pages.length > 0
                        ? fbConn.pages.map((p) => p.page_name).join(", ")
                        : "ไม่มีเพจ"}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">ยังไม่ได้เชื่อมต่อ</p>
                  )}
                </div>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${fbConn ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {fbConn ? "เชื่อมต่อแล้ว" : "ไม่ได้เชื่อมต่อ"}
              </span>
            </div>
          </div>
        </div>

        <ScheduleForm
          initialGenerateTime={user.generate_time ?? "06:00"}
          initialPostTime={user.post_time ?? "10:00"}
        />

      </div>
    </main>
  );
}
