export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase-admin";
import Link from "next/link";

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "numeric", day: "numeric", year: "numeric",
  });
}

export default async function AdminPage() {
  const supabase = createAdminClient();

  const [{ data: users }, { data: lineConns }, { data: fbConns }, { data: allDrafts }] =
    await Promise.all([
      supabase.from("users").select("user_id, full_name, brand_name, created_at").eq("role", "user").order("created_at", { ascending: false }),
      supabase.from("line_connections").select("user_id").eq("status", "active"),
      supabase.from("facebook_connections").select("user_id").eq("status", "active"),
      supabase.from("post_drafts").select("user_id, created_at").order("created_at", { ascending: false }),
    ]);

  const activeUserIds = new Set([
    ...(lineConns ?? []).map((c) => c.user_id),
    ...(fbConns ?? []).map((c) => c.user_id),
  ]);

  const latestPostByUser = new Map<string, string>();
  for (const draft of allDrafts ?? []) {
    if (!latestPostByUser.has(draft.user_id)) {
      latestPostByUser.set(draft.user_id, draft.created_at);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-zinc-50 mb-6">Clients</h1>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        {/* Search bar */}
        <div className="px-5 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 w-64">
            <SearchIcon />
            <span className="text-[15px] text-zinc-500">Search clients...</span>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm">Client Name</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm">Plan</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm">Status</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm">Last Updated</th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500 text-sm">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {(users ?? []).map((user) => {
              const isActive = activeUserIds.has(user.user_id);
              const lastUpdated = latestPostByUser.get(user.user_id) ?? user.created_at;
              const clientName = user.brand_name || user.full_name;

              return (
                <tr key={user.user_id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-zinc-200">{clientName}</td>
                  <td className="px-5 py-3.5 text-zinc-600">-</td>
                  <td className="px-5 py-3.5">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500">{formatDate(lastUpdated)}</td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/${user.user_id}`}
                      className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[15px] text-zinc-600">
                  ไม่มีข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-500 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5l3 3" strokeLinecap="round" />
    </svg>
  );
}
