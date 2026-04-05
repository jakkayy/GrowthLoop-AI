import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

async function logout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  redirect("/login");
}

type PostDraft = {
  id: string;
  caption: string;
  image_url: string | null;
  status: "pending" | "sent" | "approved" | "denied" | "expired" | "posted";
  sent_at: string | null;
  created_at: string;
};

async function getUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/login");
  try {
    const { verifyAccessToken } = await import("@/lib/auth");
    const payload = verifyAccessToken(token);
    return payload.userId;
  } catch {
    redirect("/login");
  }
}

async function getPostDrafts(userId: string): Promise<PostDraft[]> {
  const { data } = await supabase
    .from("post_drafts")
    .select("id, caption, image_url, status, sent_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

const STATUS_CONFIG: Record<PostDraft["status"], { label: string; className: string }> = {
  pending:  { label: "รอดำเนินการ", className: "bg-white/5 text-gray-400 border border-white/10" },
  sent:     { label: "ส่งแล้ว",     className: "bg-blue-400/10 text-blue-400 border border-blue-400/20" },
  approved: { label: "อนุมัติแล้ว", className: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" },
  denied:   { label: "ปฏิเสธ",      className: "bg-red-400/10 text-red-400 border border-red-400/20" },
  expired:  { label: "หมดเวลา",     className: "bg-orange-400/10 text-orange-400 border border-orange-400/20" },
  posted:   { label: "โพสต์แล้ว",   className: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" },
};

function StatusBadge({ status }: { status: PostDraft["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function PostCard({ draft }: { draft: PostDraft }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col gap-2 hover:border-emerald-500/20 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 flex-1">
          {draft.caption || "ไม่มีเนื้อหา"}
        </p>
        {draft.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={draft.image_url}
            alt="post"
            className="h-12 w-12 rounded-lg object-cover border border-white/10 shrink-0"
          />
        )}
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
        <StatusBadge status={draft.status} />
        <span className="text-xs text-gray-600">{formatDate(draft.sent_at ?? draft.created_at)}</span>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 text-xl">📭</div>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

export default async function PlatformPage() {
  const userId = await getUserId();
  const allDrafts = await getPostDrafts(userId);

  const lineDrafts = allDrafts;
  const facebookDrafts = allDrafts.filter((d) => d.status === "posted");

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d1117]">

      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 bg-[#0a0d12] flex flex-col border-r border-white/[0.06]">

        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-tight">AXIS</p>
              <p className="text-[10px] text-emerald-400/70 tracking-widest">AI MARKETING</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {/* Overview */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors"
          >
            <span className="w-4 h-4 shrink-0"><GridIcon /></span>
            <span className="text-sm">Overview</span>
          </Link>
          {/* Connect Platform — active */}
          <Link
            href="/platform"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
          >
            <span className="w-4 h-4 shrink-0"><PlatformIcon /></span>
            <span className="text-sm font-medium">Connect Platform</span>
          </Link>
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-5 border-t border-white/5 pt-4">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
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
        <header className="h-14 bg-[#0d1117] border-b border-white/[0.06] flex items-center px-6 gap-4 shrink-0">
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white">Connect Platform</h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-5 overflow-y-auto">

          {/* Connect Buttons */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#161b22] p-6">
            <h2 className="text-lg font-bold text-white mb-1">เชื่อมต่อแพลตฟอร์ม</h2>
            <p className="text-sm text-gray-500 mb-5">เลือกแพลตฟอร์มที่ต้องการเชื่อมต่อกับระบบ</p>
            <div className="flex gap-3">
              <a
                href="/api/line/login"
                className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-[#06C755] text-white py-3 font-medium hover:bg-[#05b04c] transition-colors"
              >
                <span className="font-bold">L</span> Connect LINE
              </a>
              <a
                href="/api/facebook/login"
                className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-[#1877F2] text-white py-3 font-medium hover:bg-[#1669d3] transition-colors"
              >
                <span className="font-bold">f</span> Connect Facebook
              </a>
            </div>
          </div>

          {/* History */}
          <div className="grid grid-cols-2 gap-5">

            {/* LINE History */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#161b22] flex flex-col">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                <div className="h-8 w-8 rounded-xl bg-[#06C755]/20 flex items-center justify-center text-[#06C755] text-sm font-bold border border-[#06C755]/20">L</div>
                <div>
                  <h2 className="text-sm font-semibold text-white">LINE</h2>
                  <p className="text-xs text-gray-500">ประวัติการส่งและอนุมัติ</p>
                </div>
                <span className="ml-auto text-xs font-medium bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full">
                  {lineDrafts.length} รายการ
                </span>
              </div>
              <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[600px]">
                {lineDrafts.length === 0 ? (
                  <EmptyState text="ยังไม่มีประวัติการส่งโพสต์ผ่าน LINE" />
                ) : (
                  lineDrafts.map((draft) => <PostCard key={draft.id} draft={draft} />)
                )}
              </div>
            </div>

            {/* Facebook History */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#161b22] flex flex-col">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                <div className="h-8 w-8 rounded-xl bg-[#1877F2]/20 flex items-center justify-center text-[#4a9eff] text-sm font-bold border border-[#1877F2]/20">f</div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Facebook</h2>
                  <p className="text-xs text-gray-500">โพสต์ที่เผยแพร่แล้ว</p>
                </div>
                <span className="ml-auto text-xs font-medium bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full">
                  {facebookDrafts.length} รายการ
                </span>
              </div>
              <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[600px]">
                {facebookDrafts.length === 0 ? (
                  <EmptyState text="ยังไม่มีโพสต์ที่เผยแพร่ไป Facebook" />
                ) : (
                  facebookDrafts.map((draft) => <PostCard key={draft.id} draft={draft} />)
                )}
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
