"use client";

import { useState } from "react";

type Result = {
  caption: string;
  imageUrl: string;
};

export default function TestGenerate({ userId }: { userId: string }) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/test-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Generate failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-zinc-50">Test Generate</h2>
        <p className="text-[15px] text-zinc-500 mt-0.5">
          ทดสอบสร้างรูปและแคปชั่น — ใช้ reference images และ prompt ของร้านนี้จริง ไม่บันทึกเป็น draft
        </p>
      </div>

      <div className="flex gap-3 mb-5">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
          placeholder="หัวข้อโพสต์ (ปล่อยว่าง = โปรโมทสินค้าและบริการ)"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating...
            </>
          ) : "Generate"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="grid grid-cols-2 gap-5">
          {/* Image */}
          <div>
            <p className="text-sm font-medium text-zinc-500 mb-2">Generated Image</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.imageUrl}
              alt="generated"
              className="w-full rounded-xl border border-zinc-700 object-cover"
            />
          </div>

          {/* Caption */}
          <div className="flex flex-col">
            <p className="text-sm font-medium text-zinc-500 mb-2">Generated Caption</p>
            <div className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-sm text-zinc-300 whitespace-pre-wrap overflow-y-auto max-h-80">
              {result.caption}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(result.caption)}
              className="mt-2 text-[15px] text-zinc-500 hover:text-zinc-300 text-right transition-colors"
            >
              Copy caption
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
