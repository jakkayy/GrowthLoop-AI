"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Clients",
    exact: true,
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="6" cy="5" r="2.5" />
        <path d="M1 13c0-2.76 2.24-5 5-5h0c2.76 0 5 2.24 5 5" strokeLinecap="round" />
        <path d="M11 4c1.1 0 2 .9 2 2s-.9 2-2 2M15 13c0-2.21-1.79-4-4-4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/test",
    label: "Test",
    exact: false,
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2v5L3 13h10L10 7V2" />
        <path d="M5 2h6" />
      </svg>
    ),
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {NAV_ITEMS.map(({ href, label, exact, icon }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
              active
                ? "bg-green-50 border border-green-200 text-green-700"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </Link>
        );
      })}
    </>
  );
}
