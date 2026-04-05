import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-48 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <p className="text-sm font-bold text-gray-900">AXIS</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700"
          >
            <ClientsIcon />
            <span className="text-sm font-medium">Clients</span>
          </Link>
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <LogoutButton />
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function ClientsIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 13c0-2.76 2.24-5 5-5h0c2.76 0 5 2.24 5 5" strokeLinecap="round" />
      <path d="M11 4c1.1 0 2 .9 2 2s-.9 2-2 2M15 13c0-2.21-1.79-4-4-4" strokeLinecap="round" />
    </svg>
  );
}
