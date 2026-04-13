"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Plan = "free" | "pro" | "enterprise";

const PLANS: {
  id: Plan;
  name: string;
  price: string;
  description: string;
  features: string[];
}[] = [
  {
    id: "free",
    name: "Free",
    price: "ฟรี",
    description: "สำหรับผู้เริ่มต้น",
    features: [
      "5 AI posts / เดือน",
      "1 competitor analysis",
      "Basic AI insights",
      "LINE notification",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "฿999 / เดือน",
    description: "สำหรับธุรกิจที่กำลังเติบโต",
    features: [
      "30 AI posts / เดือน",
      "5 competitor analyses",
      "Advanced AI insights",
      "Priority LINE notification",
      "Own page performance analysis",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "฿2,499 / เดือน",
    description: "สำหรับองค์กรและแบรนด์ใหญ่",
    features: [
      "Unlimited AI posts",
      "Unlimited competitors",
      "Full AI analytics",
      "Priority support",
      "Custom brand voice",
      "Own page performance analysis",
    ],
  },
];

export default function PlanSelector({ currentPlan }: { currentPlan: Plan }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Plan>(currentPlan);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    if (selected === currentPlan) return;
    setLoading(true);
    setSuccess(false);

    const res = await fetch("/api/subscription", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: selected }),
    });

    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      router.refresh();
    }
  };

  const isChanged = selected !== currentPlan;

  return (
    <div className="space-y-6">
      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isActive = selected === plan.id;
          const isCurrent = currentPlan === plan.id;

          return (
            <button
              key={plan.id}
              onClick={() => { setSelected(plan.id); setSuccess(false); }}
              className={`text-left rounded-2xl border-2 p-5 transition-all ${
                isActive
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-base font-bold text-gray-900">{plan.name}</p>
                  <p className="text-[15px] text-gray-500 mt-0.5">{plan.description}</p>
                </div>
                <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isActive ? "border-green-500 bg-green-500" : "border-gray-300"
                }`}>
                  {isActive && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 5l2 2 4-4" />
                    </svg>
                  )}
                </div>
              </div>

              <p className={`text-lg font-bold mb-4 ${isActive ? "text-green-600" : "text-gray-900"}`}>
                {plan.price}
              </p>

              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8l3 3 7-7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent && (
                <div className="mt-4 text-sm text-green-600 font-medium bg-green-100 rounded-full px-3 py-1 inline-block">
                  แผนปัจจุบัน
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirm */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleConfirm}
          disabled={!isChanged || loading}
          className="px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "กำลังบันทึก..." : "ยืนยันแผน"}
        </button>
        {success && (
          <p className="text-sm text-green-600 font-medium">เปลี่ยนแผนสำเร็จแล้ว</p>
        )}
        {!isChanged && !success && (
          <p className="text-[15px] text-gray-400">เลือกแผนอื่นเพื่อเปลี่ยน</p>
        )}
      </div>
    </div>
  );
}
