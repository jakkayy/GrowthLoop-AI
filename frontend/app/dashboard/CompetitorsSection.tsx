"use client";

import { useState, useEffect, useCallback } from "react";

type ScrapeJob = {
  id: string;
  status: "running" | "completed" | "failed";
  posts_count: number | null;
  result_url: string | null;
  started_at: string;
  completed_at: string | null;
};

type Competitor = {
  id: string;
  page_url: string;
  page_name: string;
  created_at: string;
  competitor_scrape_jobs: ScrapeJob[];
};

type InsightData = {
  content: string | null;
  created_at: string | null;
};

export default function CompetitorsSection() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [pageUrl, setPageUrl] = useState("");
  const [pageName, setPageName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [scrapingIds, setScrapingIds] = useState<Set<string>>(new Set());
  const [insights, setInsights] = useState<InsightData>({ content: null, created_at: null });
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const fetchCompetitors = useCallback(async () => {
    const res = await fetch("/api/competitors");
    if (res.ok) {
      const data: Competitor[] = await res.json();
      setCompetitors(data);
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    const res = await fetch("/api/competitors/analyze");
    if (res.ok) {
      const data = await res.json();
      setInsights(data);
    }
    setInsightsLoading(false);
  }, []);

  useEffect(() => {
    fetchCompetitors();
    fetchInsights();
  }, [fetchCompetitors, fetchInsights]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    const res = await fetch("/api/competitors/analyze", { method: "POST" });
    const json = await res.json();
    setAnalyzing(false);
    if (!res.ok) {
      setAnalyzeError(json.message ?? "เกิดข้อผิดพลาด");
      return;
    }
    fetchInsights();
  };

  useEffect(() => {
    const hasRunning = competitors.some((c) =>
      c.competitor_scrape_jobs.some((j) => j.status === "running")
    );
    if (!hasRunning) return;
    const interval = setInterval(fetchCompetitors, 6000);
    return () => clearInterval(interval);
  }, [competitors, fetchCompetitors]);

  const handleAdd = async () => {
    if (!pageUrl.trim() || !pageName.trim()) {
      setAddError("กรุณากรอก URL และชื่อเพจ");
      return;
    }
    setAddLoading(true);
    setAddError(null);
    const res = await fetch("/api/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageUrl: pageUrl.trim(), pageName: pageName.trim() }),
    });
    setAddLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setAddError(d.message ?? "เกิดข้อผิดพลาด");
      return;
    }
    setPageUrl("");
    setPageName("");
    fetchCompetitors();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/competitors/${id}`, { method: "DELETE" });
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  };

  const handleScrape = async (competitor: Competitor) => {
    setScrapingIds((prev) => new Set(prev).add(competitor.id));
    const res = await fetch(`/api/competitors/${competitor.id}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageUrl: competitor.page_url }),
    });
    setScrapingIds((prev) => {
      const next = new Set(prev);
      next.delete(competitor.id);
      return next;
    });
    if (res.ok) fetchCompetitors();
  };

  const latestJob = (c: Competitor): ScrapeJob | null => {
    if (!c.competitor_scrape_jobs.length) return null;
    return [...c.competitor_scrape_jobs].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    )[0];
  };

  const jobBadge = (job: ScrapeJob | null) => {
    if (!job)
      return <span className="text-sm text-gray-400">ยังไม่เคย scrape</span>;
    if (job.status === "running")
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-yellow-600 bg-yellow-50 border border-yellow-200 px-2.5 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
          กำลัง scrape...
        </span>
      );
    if (job.status === "failed")
      return (
        <span className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
          ล้มเหลว
        </span>
      );
    return (
      <span className="text-sm font-medium text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">
        สำเร็จ · {job.posts_count ?? 0} โพสต์
      </span>
    );
  };

  const insightLines = insights.content
    ? insights.content.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.replace(/^[-•*\d.]+\s*/, ""))
    : [];

  const formattedDate = insights.created_at
    ? new Date(insights.created_at).toLocaleDateString("th-TH", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <span className="text-sm font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full tracking-wide">
            COMPETITOR ANALYSIS
          </span>
          <h2 className="text-base font-semibold text-gray-900 mt-2">วิเคราะห์คู่แข่ง (Facebook Competitor)</h2>
          <p className="text-[15px] text-gray-400 mt-0.5">
            เพิ่มลิงก์เพจ Facebook คู่แข่ง · ดึงโพสต์และคอมเม้นต์ 7 วันล่าสุด · AI วิเคราะห์อัตโนมัติทุกสัปดาห์
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="shrink-0 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {analyzing ? "กำลังวิเคราะห์..." : "วิเคราะห์ตอนนี้"}
        </button>
      </div>

      {/* Insights result */}
      <div className="mb-5 mt-4">
        {analyzeError && (
          <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
            <p className="text-sm text-red-600">{analyzeError}</p>
          </div>
        )}
        {insightsLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-5 w-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          </div>
        ) : insightLines.length > 0 ? (
          <>
            <div className="space-y-2">
              {insightLines.map((line, i) => {
                const colonIdx = line.indexOf(":");
                const hasColon = colonIdx > 0 && colonIdx < 40;
                const title = hasColon ? line.substring(0, colonIdx).trim() : line;
                const desc = hasColon ? line.substring(colonIdx + 1).trim() : "";
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-purple-100 hover:bg-purple-50/30 transition-colors">
                    <span className="text-sm font-bold text-purple-500 shrink-0 mt-0.5 w-5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-gray-800 leading-snug">{title}</p>
                      {desc && <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            {formattedDate && (
              <p className="mt-3 text-sm text-gray-400">วิเคราะห์ล่าสุด: {formattedDate}</p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-2xl mb-2">🔍</span>
            <p className="text-[15px] font-medium text-gray-500">ยังไม่มีข้อมูลวิเคราะห์</p>
            <p className="text-sm text-gray-400 mt-1">Scrape คู่แข่งก่อน แล้วกด "วิเคราะห์ตอนนี้"</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">รายการคู่แข่ง</p>

        {/* Add form */}
        <div className="mb-5 rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-500">เพิ่มคู่แข่งใหม่</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500">ชื่อเพจ</label>
              <input
                type="text"
                placeholder="เช่น ร้านกาแฟ ABC"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                className="rounded-xl bg-white border border-gray-200 px-3 py-2 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500">Facebook Page URL</label>
              <input
                type="url"
                placeholder="https://www.facebook.com/pagename"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                className="rounded-xl bg-white border border-gray-200 px-3 py-2 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            {addError ? (
              <p className="text-sm text-red-500">{addError}</p>
            ) : (
              <span />
            )}
            <button
              onClick={handleAdd}
              disabled={addLoading}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {addLoading ? "กำลังเพิ่ม..." : "+ เพิ่มคู่แข่ง"}
            </button>
          </div>
        </div>

        {/* Competitor list */}
        {competitors.length === 0 ? (
          <p className="text-center text-[15px] text-gray-400 py-6">ยังไม่มีคู่แข่ง</p>
        ) : (
          <div className="space-y-3">
            {competitors.map((c) => {
              const job = latestJob(c);
              const isScraping = scrapingIds.has(c.id) || job?.status === "running";
              return (
                <div key={c.id} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1877F2]/15 text-[#4a9eff] text-sm font-bold border border-[#1877F2]/15">
                        f
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-gray-900 truncate">{c.page_name}</p>
                        <a
                          href={c.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-400 hover:text-green-600 truncate block transition-colors"
                        >
                          {c.page_url}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {jobBadge(job)}
                      {job?.status === "completed" && job.result_url && (
                        <a
                          href={job.result_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-600 hover:border-green-300 transition-colors"
                        >
                          ดูผล
                        </a>
                      )}
                      <button
                        onClick={() => handleScrape(c)}
                        disabled={isScraping}
                        className="rounded-lg bg-green-50 border border-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                      >
                        {isScraping ? "กำลัง scrape..." : "Scrape Now"}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isScraping}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-500 hover:border-red-200 disabled:opacity-40 transition-colors"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                  {job?.status === "completed" && job.completed_at && (
                    <p className="mt-2 text-sm text-gray-400">
                      อัปเดตล่าสุด:{" "}
                      {new Date(job.completed_at).toLocaleDateString("th-TH", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
