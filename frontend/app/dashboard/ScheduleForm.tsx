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
    <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-gray-500 uppercase tracking-wide">
        ตั้งเวลาอัตโนมัติ
      </h2>
      <p className="mb-5 text-xs text-gray-400">กำหนดเวลาที่ระบบจะ generate และโพสต์คอนเทนต์ให้อัตโนมัติทุกวัน</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">เวลา Generate โพสต์</label>
          <input
            type="time"
            value={generateTime}
            onChange={(e) => setGenerateTime(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
          <p className="text-xs text-gray-400">AI จะสร้างคอนเทนต์เวลานี้</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">เวลาโพสต์จริง</label>
          <input
            type="time"
            value={postTime}
            onChange={(e) => setPostTime(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
          <p className="text-xs text-gray-400">โพสต์ไปยัง Facebook เวลานี้</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        {message ? (
          <p className={`text-xs font-medium ${message.ok ? "text-green-600" : "text-red-500"}`}>
            {message.ok ? "✓ " : "✕ "}{message.text}
          </p>
        ) : (
          <span />
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm shadow-green-200"
        >
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}
