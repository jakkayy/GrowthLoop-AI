import { createAdminClient } from "@/lib/supabase-admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import PromptSettings from "./PromptSettings";
import ReferenceImages from "./ReferenceImages";
import TestGenerate from "./TestGenerate";

type Draft = {
  id: string;
  caption: string;
  image_url: string | null;
  status: "pending" | "sent" | "approved" | "denied" | "expired" | "posted";
  sent_at: string | null;
  created_at: string;
};

type Tab = "all" | "approved" | "denied" | "pending";

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

function filterDrafts(drafts: Draft[], tab: Tab): Draft[] {
  if (tab === "approved") return drafts.filter((d) => d.status === "approved" || d.status === "posted");
  if (tab === "denied")   return drafts.filter((d) => d.status === "denied");
  if (tab === "pending")  return drafts.filter((d) => ["pending", "sent", "expired"].includes(d.status));
  return drafts;
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { userId } = await params;
  const { tab: tabParam } = await searchParams;
  const tab: Tab = (["all", "approved", "denied", "pending"].includes(tabParam ?? "") ? tabParam : "all") as Tab;

  const supabase = createAdminClient();

  const [{ data: user }, { data: allDrafts }, { data: productGroups }, { data: ungroupedImages }] = await Promise.all([
    supabase.from("users").select("user_id, full_name, brand_name, caption_system_prompt, image_prompt_prefix").eq("user_id", userId).single(),
    supabase.from("post_drafts").select("id, caption, image_url, status, sent_at, created_at")
      .eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("product_groups").select("id, name, created_at, reference_images(id, image_url, created_at, group_id)")
      .eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("reference_images").select("id, image_url, created_at, group_id")
      .eq("user_id", userId).is("group_id", null).order("created_at", { ascending: true }),
  ]);

  if (!user) notFound();

  const drafts: Draft[] = allDrafts ?? [];
  const filtered = filterDrafts(drafts, tab);

  const totalPosts    = drafts.length;
  const totalApproved = drafts.filter((d) => d.status === "approved" || d.status === "posted").length;
  const totalDenied   = drafts.filter((d) => d.status === "denied").length;
  const totalPosted   = drafts.filter((d) => d.status === "posted").length;

  const clientName = user.brand_name || user.full_name;

  const TABS: { key: Tab; label: string }[] = [
    { key: "all",      label: "All" },
    { key: "approved", label: "Approved" },
    { key: "denied",   label: "Denied" },
    { key: "pending",  label: "Pending" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-[15px] text-gray-400 hover:text-gray-700 transition-colors mb-3 group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Clients
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{clientName}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Posts",        value: totalPosts    },
          { label: "Approved",           value: totalApproved },
          { label: "Denied",             value: totalDenied   },
          { label: "Posted to Facebook", value: totalPosted   },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-[15px] text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Test Generate */}
      <div className="mb-6">
        <TestGenerate userId={userId} />
      </div>

      {/* Reference Images */}
      <div className="mb-6">
        <ReferenceImages
          userId={userId}
          initialGroups={productGroups ?? []}
          initialUngrouped={ungroupedImages ?? []}
        />
      </div>

      {/* Prompt Settings */}
      <div className="mb-6">
        <PromptSettings
          userId={userId}
          initialCaptionSystemPrompt={user.caption_system_prompt ?? null}
          initialImagePromptPrefix={user.image_prompt_prefix ?? null}
        />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5">
          {TABS.map(({ key, label }) => (
            <Link
              key={key}
              href={`/admin/${userId}?tab=${key}`}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-sm w-16">Thumbnail</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-sm">Caption</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-sm whitespace-nowrap">Approval Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-sm whitespace-nowrap">Sent At</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-sm whitespace-nowrap">Response At</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-sm">Feedback</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-sm whitespace-nowrap">Facebook Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-sm">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((draft) => {
              const approval = APPROVAL_BADGE[draft.status] ?? APPROVAL_BADGE.pending;
              const isPosted = draft.status === "posted";

              return (
                <tr key={draft.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    {draft.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={draft.image_url} alt="post" className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-sm">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 max-w-xs">
                    <p className="text-gray-700 truncate">{draft.caption || "-"}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-medium px-2.5 py-1 rounded-full border ${approval.className}`}>
                      {approval.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(draft.sent_at)}</td>
                  <td className="px-5 py-3 text-gray-400">-</td>
                  <td className="px-5 py-3 text-gray-400">-</td>
                  <td className="px-5 py-3">
                    {isPosted ? (
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                        Posted
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                        Not Posted
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/${userId}/posts/${draft.id}`}
                      className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-[15px] text-gray-400">
                  ไม่มีโพสต์ในหมวดนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
