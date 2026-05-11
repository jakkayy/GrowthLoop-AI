import { supabase } from "@/lib/supabase";
import { getSession, logout } from "@/lib/getSession";
import UserSidebar from "@/components/UserSidebar";
import DraftStatusBadge, { PostStatus } from "@/components/DraftStatusBadge";

type PostDraft = {
  id: string;
  caption: string;
  image_url: string | null;
  status: PostStatus;
  sent_at: string | null;
  created_at: string;
};

async function getPostDrafts(userId: string): Promise<PostDraft[]> {
  const { data } = await supabase
    .from("post_drafts")
    .select("id, caption, image_url, status, sent_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function PostCard({ draft }: { draft: PostDraft }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-2 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 flex-1">
          {draft.caption || "ไม่มีเนื้อหา"}
        </p>
        {draft.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={draft.image_url}
            alt="post"
            className="h-12 w-12 rounded-lg object-cover border border-zinc-700 shrink-0"
          />
        )}
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <DraftStatusBadge status={draft.status} />
        <span className="text-[13px] text-zinc-600">{formatDate(draft.sent_at ?? draft.created_at)}</span>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3 text-xl">📭</div>
      <p className="text-[15px] text-zinc-500">{text}</p>
    </div>
  );
}

export default async function PlatformPage() {
  const { userId } = await getSession();
  const allDrafts = await getPostDrafts(userId);

  const lineDrafts = allDrafts;
  const facebookDrafts = allDrafts.filter((d) => d.status === "posted");

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <UserSidebar activePage="platform" logoutAction={logout} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-6 gap-4 shrink-0">
          <div className="flex-1">
            <h1 className="text-base font-semibold text-zinc-200">Connect Platform</h1>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-bold text-zinc-50 mb-1">เชื่อมต่อแพลตฟอร์ม</h2>
            <p className="text-[15px] text-zinc-500 mb-5">เลือกแพลตฟอร์มที่ต้องการเชื่อมต่อกับระบบ</p>
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

          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 flex flex-col">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
                <div className="h-8 w-8 rounded-xl bg-[#06C755]/15 flex items-center justify-center text-[#06C755] text-sm font-bold border border-[#06C755]/20">L</div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-50">LINE</h2>
                  <p className="text-[13px] text-zinc-500">ประวัติการส่งและอนุมัติ</p>
                </div>
                <span className="ml-auto text-sm font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 px-2.5 py-1 rounded-full">
                  {lineDrafts.length} รายการ
                </span>
              </div>
              <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[600px]">
                {lineDrafts.length === 0
                  ? <EmptyState text="ยังไม่มีประวัติการส่งโพสต์ผ่าน LINE" />
                  : lineDrafts.map((draft) => <PostCard key={draft.id} draft={draft} />)}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 flex flex-col">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
                <div className="h-8 w-8 rounded-xl bg-[#1877F2]/15 flex items-center justify-center text-[#4a9eff] text-sm font-bold border border-[#1877F2]/20">f</div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-50">Facebook</h2>
                  <p className="text-[13px] text-zinc-500">โพสต์ที่เผยแพร่แล้ว</p>
                </div>
                <span className="ml-auto text-sm font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 px-2.5 py-1 rounded-full">
                  {facebookDrafts.length} รายการ
                </span>
              </div>
              <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[600px]">
                {facebookDrafts.length === 0
                  ? <EmptyState text="ยังไม่มีโพสต์ที่เผยแพร่ไป Facebook" />
                  : facebookDrafts.map((draft) => <PostCard key={draft.id} draft={draft} />)}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
