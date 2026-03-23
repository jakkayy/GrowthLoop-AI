"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  // Account info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Brand info
  const [brandName, setBrandName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [brandTone, setBrandTone] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [marketingGoal, setMarketingGoal] = useState("");
  const [numericGoal, setNumericGoal] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const marketingGoalOptions = ["awareness", "engagement", "lead"];


  const handleRegister = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold">สมัครสมาชิก</h1>
        <p className="mb-6 text-sm text-gray-500">กรอกข้อมูลบัญชีและข้อมูลแบรนด์ของคุณ</p>

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Account Section */}
          <div>
            <h2 className="mb-3 text-lg font-semibold border-b pb-2">ข้อมูลบัญชี</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">ชื่อ</label>
                <input
                  type="text"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อของคุณ"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">อีเมล</label>
                <input
                  type="email"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">รหัสผ่าน</label>
                <input
                  type="password"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
                  minLength={6}
                />
              </div>
            </div>
          </div>

          {/* Brand Section */}
          <div>
            <h2 className="mb-3 text-lg font-semibold border-b pb-2">ข้อมูลแบรนด์</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">ชื่อแบรนด์</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="เช่น NovaBrand"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">ประเภทธุรกิจ</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="เช่น ร้านอาหาร, ความงาม, ไอที"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">คำอธิบายธุรกิจ</label>
                <textarea
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="อธิบายธุรกิจของคุณโดยย่อ"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">กลุ่มเป้าหมาย</label>
                <input
                  type="text"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="เช่น ผู้หญิงอายุ 25-35 ปี ที่รักสุขภาพ"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">โทนแบรนด์</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    value={brandTone}
                    onChange={(e) => setBrandTone(e.target.value)}
                    placeholder="เช่น เป็นมิตร, มืออาชีพ, สนุกสนาน"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">สี CI / Brand Identity</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    placeholder="เช่น #FF5733, ฟ้า-ขาว"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">รายละเอียดสินค้า/บริการ</label>
                <textarea
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={productDetails}
                  onChange={(e) => setProductDetails(e.target.value)}
                  placeholder="อธิบายสินค้าหรือบริการหลักของคุณ"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">เป้าหมายทางการตลาด</label>
                <div className="flex gap-3">
                  {marketingGoalOptions.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setMarketingGoal(goal)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        marketingGoal === goal
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">เป้าหมายเชิงตัวเลข</label>
                <input
                  type="text"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={numericGoal}
                  onChange={(e) => setNumericGoal(e.target.value)}
                  placeholder="เช่น awareness 200K ภายใน 3 เดือน"
                  required
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          {successMessage && (
            <p className="text-sm text-green-600">{successMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black text-white px-4 py-2.5 font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </button>
        </form>
      </div>
    </main>
  );
}
