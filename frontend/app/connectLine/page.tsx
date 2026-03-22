"use client";

export default function ConnectLinePage() {
  const lineAddFriendUrl = "https://line.me/R/ti/p/@767aubcx";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow text-center">
        <h1 className="text-2xl font-bold mb-4">Connect LINE</h1>

        <p className="mb-6">กรุณาเพิ่มเพื่อน LINE เพื่อเชื่อมต่อระบบ</p>

        <a
          href={lineAddFriendUrl}
          target="_blank"
          className="block w-full rounded-lg bg-green-500 text-white py-3 font-medium"
        >
          ➕ Add LINE Friend
        </a>
      </div>
    </main>
  );
}
