"use client";

import { useState } from "react";

type Props = {
  userId: string;
  initialCaptionSystemPrompt: string | null;
  initialImagePromptPrefix: string | null;
};

export default function PromptSettings({
  userId,
  initialCaptionSystemPrompt,
  initialImagePromptPrefix,
}: Props) {
  const [captionPrompt, setCaptionPrompt] = useState(initialCaptionSystemPrompt ?? "");
  const [imagePrefix, setImagePrefix] = useState(initialImagePromptPrefix ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/prompts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption_system_prompt: captionPrompt.trim() || null,
          image_prompt_prefix: imagePrefix.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Save failed");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">Prompt Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          ปล่อยว่างเพื่อใช้ default prompt ของระบบ
        </p>
      </div>

      <div className="space-y-5">
        {/* Caption system prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Caption System Prompt
          </label>
          <p className="text-xs text-gray-400 mb-2">
            กำหนดบุคลิกและสไตล์การเขียนแคปชั่นของ AI สำหรับร้านนี้
          </p>
          <textarea
            value={captionPrompt}
            onChange={(e) => setCaptionPrompt(e.target.value)}
            rows={4}
            placeholder="ปล่อยว่าง = ใช้ default prompt"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y font-mono"
          />
        </div>

        {/* Image prompt prefix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Image Prompt Prefix
          </label>
          <p className="text-xs text-gray-400 mb-2">
            ประโยคนำก่อนแคปชั่นในการสร้างรูป เช่น{" "}
            <span className="font-mono bg-gray-100 px-1 rounded">
              Create a minimalist product photo for
            </span>
            {" "}(ค่า default: <span className="font-mono bg-gray-100 px-1 rounded">Create a clean social media promotional image for</span>)
          </p>
          <textarea
            value={imagePrefix}
            onChange={(e) => setImagePrefix(e.target.value)}
            rows={4}
            placeholder="ปล่อยว่าง = ใช้ default prefix"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y font-mono"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Prompts"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">Saved</span>
        )}
        {error && (
          <span className="text-sm text-red-500">{error}</span>
        )}
      </div>
    </div>
  );
}
