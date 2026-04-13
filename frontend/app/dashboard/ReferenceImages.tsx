"use client";

import { useRef, useState } from "react";

type RefImage = {
  id: string;
  image_url: string;
  created_at: string;
  group_id: string | null;
};

type ProductGroup = {
  id: string;
  name: string;
  created_at: string;
  reference_images: RefImage[];
};

type Props = {
  initialGroups: ProductGroup[];
  initialUngrouped: RefImage[];
};

export default function ReferenceImages({ initialGroups, initialUngrouped }: Props) {
  const [groups, setGroups] = useState<ProductGroup[]>(initialGroups);
  const [ungrouped, setUngrouped] = useState<RefImage[]>(initialUngrouped);
  const [activeId, setActiveId] = useState<string | "ungrouped">(
    initialGroups[0]?.id ?? (initialUngrouped.length > 0 ? "ungrouped" : "")
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const activeGroup = groups.find((g) => g.id === activeId) ?? null;
  const activeImages = activeId === "ungrouped" ? ungrouped : (activeGroup?.reference_images ?? []);
  const showUngroupedTab = ungrouped.length > 0;

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      if (activeId !== "ungrouped" && activeId) formData.append("group_id", activeId);

      const res = await fetch("/api/user/reference-images", { method: "POST", body: formData });
      if (res.ok) {
        const newImage: RefImage = await res.json();
        if (activeId === "ungrouped" || !activeId) {
          setUngrouped((prev) => [...prev, newImage]);
        } else {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === activeId
                ? { ...g, reference_images: [...g.reference_images, newImage] }
                : g
            )
          );
        }
      } else {
        const data = await res.json();
        setError(data.message ?? "Upload failed");
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(imageId: string) {
    const res = await fetch(`/api/user/reference-images/${imageId}`, { method: "DELETE" });
    if (res.ok) {
      if (activeId === "ungrouped") {
        setUngrouped((prev) => prev.filter((img) => img.id !== imageId));
      } else {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === activeId
              ? { ...g, reference_images: g.reference_images.filter((img) => img.id !== imageId) }
              : g
          )
        );
      }
    } else {
      const data = await res.json();
      setError(data.message ?? "Delete failed");
    }
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/user/product-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName.trim() }),
    });
    if (res.ok) {
      const group: ProductGroup = await res.json();
      setGroups((prev) => [...prev, group]);
      setActiveId(group.id);
      setNewGroupName("");
      setCreatingGroup(false);
    } else {
      const data = await res.json();
      setError(data.message ?? "Create failed");
    }
    setSaving(false);
  }

  async function handleDeleteGroup(groupId: string) {
    const res = await fetch(`/api/user/product-groups/${groupId}`, { method: "DELETE" });
    if (res.ok) {
      const deleted = groups.find((g) => g.id === groupId);
      if (deleted?.reference_images.length) {
        setUngrouped((prev) => [
          ...prev,
          ...deleted.reference_images.map((img) => ({ ...img, group_id: null })),
        ]);
      }
      const remaining = groups.filter((g) => g.id !== groupId);
      setGroups(remaining);
      setActiveId(remaining[0]?.id ?? (ungrouped.length > 0 ? "ungrouped" : ""));
    } else {
      const data = await res.json();
      setError(data.message ?? "Delete failed");
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Product Images</h2>
        <p className="text-[15px] text-gray-500 mt-0.5">AI จะสุ่มเลือก 1 กลุ่มต่อวันเพื่อสร้างภาพ</p>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0 mb-4 border-b border-gray-200">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => { setActiveId(g.id); setCreatingGroup(false); }}
            className={`group/tab relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeId === g.id
                ? "border-green-600 text-green-700 bg-green-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {g.name}
            <span className="text-[10px] text-gray-400 font-normal">({g.reference_images.length})</span>
            {activeId === g.id && (
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }}
                className="ml-0.5 text-gray-300 hover:text-red-400 transition-colors leading-none"
                title="ลบกลุ่ม"
              >
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </span>
            )}
          </button>
        ))}

        {showUngroupedTab && (
          <button
            onClick={() => { setActiveId("ungrouped"); setCreatingGroup(false); }}
            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeId === "ungrouped"
                ? "border-gray-400 text-gray-600 bg-gray-50"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            ไม่มีกลุ่ม
            <span className="text-[10px] text-gray-400 font-normal">({ungrouped.length})</span>
          </button>
        )}

        {/* + สร้างกลุ่ม */}
        {creatingGroup ? (
          <div className="flex items-center gap-1.5 px-2 py-1 -mb-px">
            <input
              ref={nameInputRef}
              type="text"
              placeholder="ชื่อสินค้า..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGroup();
                if (e.key === "Escape") { setCreatingGroup(false); setNewGroupName(""); }
              }}
              autoFocus
              className="w-28 text-sm border border-green-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <button
              onClick={handleCreateGroup}
              disabled={saving || !newGroupName.trim()}
              className="text-sm text-green-600 font-medium hover:text-green-700 disabled:opacity-50"
            >
              {saving ? "..." : "ตกลง"}
            </button>
            <button
              onClick={() => { setCreatingGroup(false); setNewGroupName(""); }}
              className="text-[15px] text-gray-400 hover:text-gray-600"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setCreatingGroup(true); setActiveId(""); }}
            className="flex items-center gap-1 px-3 py-2 text-[15px] text-gray-400 hover:text-green-600 border-b-2 border-transparent -mb-px transition-colors whitespace-nowrap"
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            สร้างกลุ่มสินค้า
          </button>
        )}
      </div>

      {/* Content */}
      {!activeId || creatingGroup ? (
        <div className="py-6 text-center">
          <p className="text-[15px] text-gray-400">พิมพ์ชื่อสินค้าแล้วกด Enter เพื่อสร้างกลุ่ม</p>
        </div>
      ) : activeImages.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-green-300 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </div>
          <p className="text-[15px] text-gray-400">คลิกเพื่ออัปโหลดรูปสินค้า</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {activeImages.map((img) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_url} alt="reference" className="w-full h-full object-cover" />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {activeId && !creatingGroup && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[15px] text-gray-500 hover:text-green-600 hover:border-green-300 disabled:opacity-50 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />
    </div>
  );
}
