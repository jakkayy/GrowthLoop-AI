import { createAdminClient } from "@/lib/supabase-admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import DraftStatusBadge, { PostStatus } from "@/components/DraftStatusBadge";
import ReferenceImages from "@/components/ReferenceImages";
import PromptSettings from "./PromptSettings";
import TestGenerate from "./TestGenerate";

type Draft = {
  id: string;
  caption: string;
  image_url: string | null;
  status: PostStatus;
  sent_at: string | null;
  created_at: string;
};

type Tab = "all" | "approved" | "denied" | "pending";

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
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-[15px] text-zinc-500 hover:text-zinc-300 transition-colors mb-3 group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Clients
        </Link>
        <h1 className="text-xl font-bold text-zinc-50">{clientName}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Posts",        value: totalPosts    },
          { label: "Approved",           value: totalApproved },
          { label: "Denied",             value: totalDenied   },
          { label: "Posted to Facebook", value: totalPosted   },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
            <p className="text-2xl font-bold text-zinc-50">{stat.value}</p>
            <p className="text-[15px] text-zinc-500 mt-0.5">{stat.label}</p>
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
          apiBase={`/api/admin/users/${userId}`}
          initialGroups={productGroups ?? []}
          initialUngrouped={ungroupedImages ?? []}
          columns={4}
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
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-5">
          {TABS.map(({ key, label }) => (
            <Link
              key={key}
              href={`/admin/${userId}?tab=${key}`}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm w-16">Thumbnail</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm">Caption</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm whitespace-nowrap">Approval Status</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm whitespace-nowrap">Sent At</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm whitespace-nowrap">Response At</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm">Feedback</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm whitespace-nowrap">Facebook Status</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((draft) => {
              const isPosted = draft.status === "posted";

              return (
                <tr key={draft.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-3">
                    {draft.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={draft.image_url} alt="post" className="h-10 w-10 rounded-lg object-cover border border-zinc-700" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 text-[10px]">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 max-w-xs">
                    <p className="text-zinc-400 truncate">{draft.caption || "-"}</p>
                  </td>
                  <td className="px-5 py-3">
                    <DraftStatusBadge status={draft.status} variant="admin" />
                  </td>
                  <td className="px-5 py-3 text-zinc-500 whitespace-nowrap">{formatDateTime(draft.sent_at)}</td>
                  <td className="px-5 py-3 text-zinc-600">-</td>
                  <td className="px-5 py-3 text-zinc-600">-</td>
                  <td className="px-5 py-3">
                    {isPosted ? (
                      <span className="text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                        Posted
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-zinc-500 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full">
                        Not Posted
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/${userId}/posts/${draft.id}`}
                      className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-[15px] text-zinc-600">
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
