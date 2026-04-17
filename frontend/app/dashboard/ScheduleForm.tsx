"use client";

import { useState } from "react";

export default function ScheduleForm({
  initialGenerateTime,
  initialPostTime,
  initialReportTime,
}: {
  initialGenerateTime: string;
  initialPostTime: string;
  initialReportTime: string;
}) {
  const [generateTime, setGenerateTime] = useState(initialGenerateTime);
  const [postTime, setPostTime] = useState(initialPostTime);
  const [reportTime, setReportTime] = useState(initialReportTime);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/user/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generate_time: generateTime, post_time: postTime, report_time: reportTime }),
    });
    const data = await res.json();
    setLoading(false);
    setMessage({ text: data.message, ok: res.ok });
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-0.5">ตั้งเวลาอัตโนมัติ</h2>
      <p className="text-[15px] text-gray-500 mb-5">กำหนดเวลาที่จะให้ระบบทำงานให้อัตโนมัติทุกวัน</p>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600">เวลา Generate โพสต์</label>
          <input
            type="time"
            value={generateTime}
            onChange={(e) => setGenerateTime(e.target.value)}
            className="rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition"
          />
          <p className="text-[15px] text-gray-400">AI จะสร้างคอนเทนต์เวลานี้ และส่งให้ตรวจสอบทาง LINE</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600">เวลาโพสต์จริง</label>
          <input
            type="time"
            value={postTime}
            onChange={(e) => setPostTime(e.target.value)}
            className="rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition"
          />
          <p className="text-[15px] text-gray-400">โพสต์ไปยัง Facebook เวลานี้</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600">เวลาส่งรายงาน</label>
          <input
            type="time"
            value={reportTime}
            onChange={(e) => setReportTime(e.target.value)}
            className="rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition"
          />
          <p className="text-[15px] text-gray-400">ส่งสรุป engagement ไป LINE</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        {message ? (
          <p className={`text-sm font-medium ${message.ok ? "text-green-600" : "text-red-500"}`}>
            {message.ok ? "✓ " : "✕ "}{message.text}
          </p>
        ) : (
          <span />
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}
