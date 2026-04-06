import React from "react";
import Link from "next/link";

type UserSidebarProps = {
  activePage: "overview" | "subscription" | "platform";
  logoutAction: () => Promise<void>;
};

export default function UserSidebar({ activePage, logoutAction }: UserSidebarProps) {
  const items: Array<{
    key: UserSidebarProps["activePage"];
    label: string;
    href: string;
    icon: React.ReactElement;
  }> = [
    {
      key: "overview",
      label: "Overview",
      href: "/dashboard",
      icon: <GridIcon />,
    },
    {
      key: "subscription",
      label: "Subscription",
      href: "/dashboard/subscription",
      icon: <SubscriptionIcon />,
    },
    {
      key: "platform",
      label: "Connect Platform",
      href: "/platform",
      icon: <PlatformIcon />,
    },
  ];

  return (
    <aside className="w-56 shrink-0 bg-white flex flex-col border-r border-gray-200">
      <div className="px-5 pt-6 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <p className="text-gray-900 text-sm font-bold leading-tight">AXIS</p>
            <p className="text-[10px] text-green-600/70 tracking-widest">AI MARKETING</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const isActive = item.key === activePage;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={
                isActive
                  ? "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700"
                  : "flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
              }
            >
              <span className="w-4 h-4 shrink-0">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5 border-t border-gray-100 pt-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <span className="w-4 h-4 shrink-0"><LogoutIcon /></span>
            <span className="text-sm">Log Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

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

function SubscriptionIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="10" rx="2" />
      <path d="M1 6h14" />
      <path d="M5 10h3M10 10h1" />
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
