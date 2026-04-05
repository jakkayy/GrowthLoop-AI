"use client";

import { useState } from "react";

export default function ScheduleForm({
  initialGenerateTime,
  initialPostTime,
}: {
  initialGenerateTime: string;
  initialPostTime: string;
}) {
  const [generateTime, setGenerateTime] = useState(initialGenerateTime);
  const [postTime, setPostTime] = useState(initialPostTime);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/user/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generate_time: generateTime, post_time: postTime }),
    });
    const data = await res.json();
    setLoading(false);
    setMessage({ text: data.message, ok: res.ok });
  };

  return (
    <div className="rounded-2xl bg-[#161b22] border border-white/[0.08] p-6">
      <h2 className="text-sm font-semibold text-white mb-0.5">ตั้งเวลาอัตโนมัติ</h2>
      <p className="text-xs text-gray-500 mb-5">กำหนดเวลาที่ระบบจะ generate และโพสต์คอนเทนต์ให้อัตโนมัติทุกวัน</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-400">เวลา Generate โพสต์</label>
          <input
            type="time"
            value={generateTime}
            onChange={(e) => setGenerateTime(e.target.value)}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition [color-scheme:dark]"
          />
          <p className="text-xs text-gray-600">AI จะสร้างคอนเทนต์เวลานี้</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-400">เวลาโพสต์จริง</label>
          <input
            type="time"
            value={postTime}
            onChange={(e) => setPostTime(e.target.value)}
            className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition [color-scheme:dark]"
          />
          <p className="text-xs text-gray-600">โพสต์ไปยัง Facebook เวลานี้</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        {message ? (
          <p className={`text-xs font-medium ${message.ok ? "text-emerald-400" : "text-red-400"}`}>
            {message.ok ? "✓ " : "✕ "}{message.text}
          </p>
        ) : (
          <span />
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}
