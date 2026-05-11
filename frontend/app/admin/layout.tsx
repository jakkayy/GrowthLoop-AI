import LogoutButton from "./LogoutButton";
import AdminNav from "./AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-48 shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col">
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">G</span>
            </div>
            <p className="text-sm font-bold text-zinc-50">Growthloop</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <AdminNav />
        </nav>
        <div className="px-3 py-4 border-t border-zinc-800">
          <LogoutButton />
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
