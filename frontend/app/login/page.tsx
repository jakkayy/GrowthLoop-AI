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

    if (data.user?.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Back button */}
      <div className="absolute top-5 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[15px] text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          ← กลับหน้าหลัก
        </Link>
      </div>

      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-violet-600/6 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">G</span>
          </div>
          <span className="text-lg font-bold text-zinc-50">Growthloop AI</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <h1 className="mb-1 text-2xl font-bold text-zinc-50">เข้าสู่ระบบ</h1>
          <p className="mb-6 text-[15px] text-zinc-500">ยินดีต้อนรับกลับมา</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">อีเมล</label>
              <input
                type="email"
                className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">รหัสผ่าน</label>
              <input
                type="password"
                className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่านของคุณ"
                required
              />
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 text-white px-4 py-3 font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p className="mt-5 text-center text-[15px] text-zinc-500">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="font-semibold text-violet-400 hover:text-violet-300">
              สมัครสมาชิก
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-[13px] text-zinc-600">
          © 2026 Growthloop AI. All rights reserved.
        </p>
      </div>
    </main>
  );
}
