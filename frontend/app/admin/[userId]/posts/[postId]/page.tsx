import { createAdminClient } from "@/lib/supabase-admin";
import Link from "next/link";
import { notFound } from "next/navigation";

const APPROVAL_BADGE: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "text-green-700 bg-green-50 border-green-200" },
  posted:   { label: "Approved", className: "text-green-700 bg-green-50 border-green-200" },
  denied:   { label: "Denied",   className: "text-red-600 bg-red-50 border-red-200" },
  pending:  { label: "Pending",  className: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  sent:     { label: "Pending",  className: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  expired:  { label: "Expired",  className: "text-orange-700 bg-orange-50 border-orange-200" },
};

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ userId: string; postId: string }>;
}) {
  const { userId, postId } = await params;
  const supabase = createAdminClient();

  const [{ data: user }, { data: draft }] = await Promise.all([
    supabase.from("users").select("user_id, full_name, brand_name").eq("user_id", userId).single(),
    supabase.from("post_drafts").select("id, caption, image_url, status, sent_at, created_at")
      .eq("id", postId).eq("user_id", userId).single(),
  ]);

  if (!user || !draft) notFound();

  const approval = APPROVAL_BADGE[draft.status] ?? APPROVAL_BADGE.pending;
  const isPosted = draft.status === "posted";
  const clientName = user.brand_name || user.full_name;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href={`/admin/${userId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-3 group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          {clientName}
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Link href="/admin" className="hover:text-gray-600 transition-colors">Clients</Link>
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9l3-3-3-3" />
          </svg>
          <Link href={`/admin/${userId}`} className="hover:text-gray-600 transition-colors">{clientName}</Link>
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9l3-3-3-3" />
          </svg>
          <span className="text-gray-600 font-medium">Post Detail</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Image */}
        {draft.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.image_url} alt="post" className="w-full object-cover max-h-[420px]" />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            ไม่มีรูปภาพ
          </div>
        )}

        {/* Details */}
        <div className="p-6 space-y-5">
          {/* Caption */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Caption</p>
            <p className="text-sm text-gray-700 leading-relaxed">{draft.caption || "-"}</p>
          </div>

          {/* Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Approval Status</p>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${approval.className}`}>
                {approval.label}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Facebook Status</p>
              {isPosted ? (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                  Posted
                </span>
              ) : (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                  Not Posted
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Time row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">LINE Sent At</p>
              <p className="text-sm text-gray-700">{formatDateTime(draft.sent_at)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Response At</p>
              <p className="text-sm text-gray-400">-</p>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Feedback</p>
            <p className="text-sm text-gray-400">-</p>
          </div>

          <div className="border-t border-gray-100" />

          {/* Facebook info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Facebook Posted At</p>
              <p className="text-sm text-gray-400">-</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Facebook URL</p>
              <p className="text-sm text-gray-400">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
