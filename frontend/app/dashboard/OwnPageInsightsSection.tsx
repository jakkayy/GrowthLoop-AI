"use client";

import { useState, useEffect, useCallback } from "react";

type InsightData = {
  content: string | null;
  created_at: string | null;
};

export default function OwnPageInsightsSection() {
  const [data, setData] = useState<InsightData>({ content: null, created_at: null });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    const res = await fetch("/api/facebook/own-page-insights");
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    const res = await fetch("/api/facebook/own-page-insights", { method: "POST" });
    const json = await res.json();
    setAnalyzing(false);
    if (!res.ok) {
      setError(json.message ?? "เกิดข้อผิดพลาด");
      return;
    }
    fetchInsights();
  };

  const insightLines = data.content
    ? data.content.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.replace(/^[-•*\d.]+\s*/, ""))
    : [];

  const formattedDate = data.created_at
    ? new Date(data.created_at).toLocaleDateString("th-TH", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full tracking-wide uppercase">
            PAGE PERFORMANCE
          </span>
          <h2 className="text-base font-semibold text-zinc-50 mt-2">วิเคราะห์เพจของลูกค้า</h2>
          <p className="text-[15px] text-zinc-500 mt-0.5">
            ดึงโพสต์ 7 วันล่าสุด · วิเคราะห์ engagement · AI ให้แนวทาง
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
        >
          {analyzing ? "กำลังวิเคราะห์..." : "วิเคราะห์ตอนนี้"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-5 w-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      ) : insightLines.length > 0 ? (
        <>
          <div className="space-y-2">
            {insightLines.map((line, i) => {
              const num = String(i + 1).padStart(2, "0");
              const colonIdx = line.indexOf(":");
              const hasColon = colonIdx > 0 && colonIdx < 40;
              const title = hasColon ? line.substring(0, colonIdx).trim() : line;
              const desc = hasColon ? line.substring(colonIdx + 1).trim() : "";
              return (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-blue-500/30 transition-colors">
                  <span className="text-sm font-bold text-blue-400 shrink-0 mt-0.5 w-5">{num}</span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-zinc-200 leading-snug">{title}</p>
                    {desc && <p className="text-sm text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          {formattedDate && (
            <p className="mt-3 text-sm text-zinc-600">วิเคราะห์ล่าสุด: {formattedDate}</p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-12 w-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-[15px] font-medium text-zinc-500">ยังไม่มีข้อมูลวิเคราะห์</p>
          <p className="text-sm text-zinc-600 mt-1">กด "วิเคราะห์ตอนนี้" เพื่อดึงข้อมูล<br />โพสต์ 7 วันล่าสุดจากเพจที่เชื่อมต่อ</p>
        </div>
      )}
    </div>
  );
}
