"use client";

import { useState } from "react";
import TestGenerate from "../[userId]/TestGenerate";

type User = {
  user_id: string;
  full_name: string | null;
  brand_name: string | null;
};

export default function TestPage({ users }: { users: User[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Test Generate</h1>
        <p className="text-[15px] text-gray-500 mt-1">ทดสอบสร้างรูปและแคปชั่นต่อร้าน</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">เลือกร้าน</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-72 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
        >
          <option value="">— เลือกร้าน —</option>
          {users.map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.brand_name || u.full_name || u.user_id}
            </option>
          ))}
        </select>
      </div>

      {selectedUserId ? (
        <TestGenerate userId={selectedUserId} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-[15px] text-gray-400">
          เลือกร้านด้านบนเพื่อเริ่มทดสอบ
        </div>
      )}
    </div>
  );
}
