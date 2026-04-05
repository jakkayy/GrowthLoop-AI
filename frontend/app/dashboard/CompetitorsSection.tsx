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

export default function CompetitorsSection() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [pageUrl, setPageUrl] = useState("");
  const [pageName, setPageName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [scrapingIds, setScrapingIds] = useState<Set<string>>(new Set());

  const fetchCompetitors = useCallback(async () => {
    const res = await fetch("/api/competitors");
    if (res.ok) {
      const data: Competitor[] = await res.json();
      setCompetitors(data);
    }
  }, []);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  // Poll every 6 seconds when any job is running
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
    if (res.ok) {
      fetchCompetitors();
    }
  };

  const latestJob = (c: Competitor): ScrapeJob | null => {
    if (!c.competitor_scrape_jobs.length) return null;
    return [...c.competitor_scrape_jobs].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    )[0];
  };

  const jobBadge = (job: ScrapeJob | null) => {
    if (!job) return <span className="text-xs text-gray-400">ยังไม่เคย scrape</span>;
    if (job.status === "running")
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
          กำลัง scrape...
        </span>
      );
    if (job.status === "failed")
      return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">ล้มเหลว</span>;
    return (
      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        สำเร็จ · {job.posts_count ?? 0} โพสต์
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-gray-500 uppercase tracking-wide">
        คู่แข่ง Facebook
      </h2>
      <p className="mb-5 text-xs text-gray-400">
        เพิ่มลิงก์เพจ Facebook คู่แข่ง ระบบจะดึงโพสต์และคอมเม้นต์ 7 วันล่าสุดอัตโนมัติทุกสัปดาห์
      </p>

      {/* Add form */}
      <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <p className="text-xs font-medium text-gray-600">เพิ่มคู่แข่งใหม่</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">ชื่อเพจ</label>
            <input
              type="text"
              placeholder="เช่น ร้านกาแฟ ABC"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Facebook Page URL</label>
            <input
              type="url"
              placeholder="https://www.facebook.com/pagename"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          {addError ? (
            <p className="text-xs text-red-500">{addError}</p>
          ) : (
            <span />
          )}
          <button
            onClick={handleAdd}
            disabled={addLoading}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {addLoading ? "กำลังเพิ่ม..." : "+ เพิ่มคู่แข่ง"}
          </button>
        </div>
      </div>

      {/* Competitor list */}
      {competitors.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-6">ยังไม่มีคู่แข่ง</p>
      ) : (
        <div className="space-y-3">
          {competitors.map((c) => {
            const job = latestJob(c);
            const isScraping = scrapingIds.has(c.id) || job?.status === "running";
            return (
              <div
                key={c.id}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1877F2] text-white text-xs font-bold shadow-sm">
                      f
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.page_name}</p>
                      <a
                        href={c.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline truncate block"
                      >
                        {c.page_url}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {jobBadge(job)}
                    {job?.status === "completed" && job.result_url && (
                      <a
                        href={job.result_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
                      >
                        ดูผล
                      </a>
                    )}
                    <button
                      onClick={() => handleScrape(c)}
                      disabled={isScraping}
                      className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      {isScraping ? "กำลัง scrape..." : "Scrape Now"}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={isScraping}
                      className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
                {job?.status === "completed" && job.completed_at && (
                  <p className="mt-2 text-xs text-gray-400">
                    อัปเดตล่าสุด:{" "}
                    {new Date(job.completed_at).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
