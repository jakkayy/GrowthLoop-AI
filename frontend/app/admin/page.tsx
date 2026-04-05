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
      <h1 className="text-xl font-bold text-gray-900 mb-6">Clients</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Search bar */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-64">
            <SearchIcon />
            <span className="text-sm text-gray-400">Search clients...</span>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Client Name</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Plan</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Last Updated</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(users ?? []).map((user) => {
              const isActive = activeUserIds.has(user.user_id);
              const lastUpdated = latestPostByUser.get(user.user_id) ?? user.created_at;
              const clientName = user.brand_name || user.full_name;

              return (
                <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{clientName}</td>
                  <td className="px-5 py-3.5 text-gray-400">-</td>
                  <td className="px-5 py-3.5">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{formatDate(lastUpdated)}</td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/${user.user_id}`}
                      className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
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
    <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5l3 3" strokeLinecap="round" />
    </svg>
  );
}
