"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INPUT = "w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition";
const LABEL = "mb-1.5 block text-sm font-medium text-zinc-300";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [brandName, setBrandName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [brandTone, setBrandTone] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [marketingGoal, setMarketingGoal] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const marketingGoalOptions = ["awareness", "engagement", "lead"];

  const handleRegister = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        brand_name: brandName,
        business_type: businessType,
        description: businessDescription,
        target: targetAudience,
        tone_brand: brandTone,
        ci_color: brandColor,
        market_goal: marketingGoal,
      }),
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
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Back button */}
      <div className="absolute top-5 left-6 z-20">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[15px] text-zinc-500 hover:text-zinc-200 transition-colors">
          ← กลับหน้าหลัก
        </Link>
      </div>

      {/* Glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-violet-600/6 blur-[120px]" />

      <div className="relative z-10 w-full max-w-2xl py-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">G</span>
          </div>
          <span className="text-lg font-bold text-zinc-50">Growthloop AI</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <h1 className="mb-1 text-2xl font-bold text-zinc-50">สมัครสมาชิก</h1>
          <p className="mb-8 text-[15px] text-zinc-500">กรอกข้อมูลบัญชีและข้อมูลแบรนด์ของคุณ</p>

          <form onSubmit={handleRegister} className="space-y-8">
            {/* Account Section */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold">1</div>
                <h2 className="text-base font-semibold text-zinc-50">ข้อมูลบัญชี</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={LABEL}>ชื่อ</label>
                  <input type="text" className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อของคุณ" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>อีเมล</label>
                    <input type="email" className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                  </div>
                  <div>
                    <label className={LABEL}>รหัสผ่าน</label>
                    <input type="password" className={INPUT} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" required minLength={6} />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800" />

            {/* Brand Section */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold">2</div>
                <h2 className="text-base font-semibold text-zinc-50">ข้อมูลแบรนด์</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>ชื่อแบรนด์</label>
                    <input type="text" className={INPUT} value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="เช่น NovaBrand" required />
                  </div>
                  <div>
                    <label className={LABEL}>ประเภทธุรกิจ</label>
                    <input type="text" className={INPUT} value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="เช่น ร้านอาหาร, ความงาม" required />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>คำอธิบายธุรกิจ</label>
                  <textarea
                    className={`${INPUT} resize-none`}
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="อธิบายธุรกิจของคุณโดยย่อ"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className={LABEL}>กลุ่มเป้าหมาย</label>
                  <input type="text" className={INPUT} value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="เช่น ผู้หญิงอายุ 25-35 ปี ที่รักสุขภาพ" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>โทนแบรนด์</label>
                    <input type="text" className={INPUT} value={brandTone} onChange={(e) => setBrandTone(e.target.value)} placeholder="เช่น เป็นมิตร, มืออาชีพ" required />
                  </div>
                  <div>
                    <label className={LABEL}>สี CI / Brand Identity</label>
                    <input type="text" className={INPUT} value={brandColor} onChange={(e) => setBrandColor(e.target.value)} placeholder="เช่น #FF5733, ฟ้า-ขาว" required />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>รายละเอียดสินค้า/บริการ</label>
                  <textarea
                    className={`${INPUT} resize-none`}
                    value={productDetails}
                    onChange={(e) => setProductDetails(e.target.value)}
                    placeholder="อธิบายสินค้าหรือบริการหลักของคุณ"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">เป้าหมายทางการตลาด</label>
                  <div className="flex gap-2">
                    {marketingGoalOptions.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => setMarketingGoal(goal)}
                        className={`rounded-full px-5 py-2 text-sm font-medium transition-colors border ${
                          marketingGoal === goal
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-violet-500/50 hover:text-violet-400"
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
              {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </button>
          </form>

          <p className="mt-5 text-center text-[15px] text-zinc-500">
            มีบัญชีแล้ว?{" "}
            <Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300">
              เข้าสู่ระบบ
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
