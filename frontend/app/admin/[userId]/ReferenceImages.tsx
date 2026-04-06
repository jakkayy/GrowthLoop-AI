"use client";

import { useRef, useState } from "react";

type RefImage = {
  id: string;
  image_url: string;
  created_at: string;
};

type Props = {
  userId: string;
  initialImages: RefImage[];
};

export default function ReferenceImages({ userId, initialImages }: Props) {
  const [images, setImages] = useState<RefImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/users/${userId}/reference-images`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const newImage: RefImage = await res.json();
        setImages((prev) => [...prev, newImage]);
      } else {
        const data = await res.json();
        setError(data.message ?? "Upload failed");
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(imageId: string) {
    const res = await fetch(`/api/admin/users/${userId}/reference-images/${imageId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } else {
      const data = await res.json();
      setError(data.message ?? "Delete failed");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Reference Images</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            รูปต้นแบบที่ AI จะใช้เป็น style reference ในการสร้างรูป
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {images.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center cursor-pointer hover:border-gray-300 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <p className="text-sm text-gray-400">ยังไม่มีรูป reference — คลิกเพื่ออัปโหลด</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt="reference"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
