"use client";

import Link from "next/link";

export default function PlatformPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md mb-3">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
        >
          ← กลับ Dashboard
        </Link>
      </div>
      <div className="w-full max-w-md rounded-2xl border p-6 shadow text-center">
        <h1 className="text-2xl font-bold mb-2">เชื่อมต่อแพลตฟอร์ม</h1>
        <p className="mb-6 text-sm text-gray-500">
          เลือกแพลตฟอร์มที่ต้องการเชื่อมต่อกับระบบ
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="/api/line/login"
            className="block w-full rounded-lg bg-[#06C755] text-white py-3 font-medium hover:bg-[#05b04c] transition-colors"
          >
            Connect LINE
          </a>

          <a
            href="/api/facebook/login"
            className="block w-full rounded-lg bg-[#1877F2] text-white py-3 font-medium hover:bg-[#1669d3] transition-colors"
          >
            Connect Facebook
          </a>
        </div>
      </div>
    </main>
  );
}
