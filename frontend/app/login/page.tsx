"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrorMessage(data.message ?? "เกิดข้อผิดพลาด");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-green-200/50 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="text-lg font-bold text-gray-900">AXIS</span>
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-8 shadow-lg shadow-green-100">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">เข้าสู่ระบบ</h1>
          <p className="mb-6 text-sm text-gray-500">ยินดีต้อนรับกลับมา</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">อีเมล</label>
              <input
                type="email"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">รหัสผ่าน</label>
              <input
                type="password"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่านของคุณ"
                required
              />
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-600 text-white px-4 py-3 font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shadow-md shadow-green-200"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="font-semibold text-green-600 hover:text-green-700">
              สมัครสมาชิก
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © 2026 AXIS. All rights reserved.
        </p>
      </div>
    </main>
  );
}
