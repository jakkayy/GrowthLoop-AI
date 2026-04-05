export default function FacebookPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-emerald-400 text-xl">✓</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Facebook connected</h1>
        <p className="text-sm text-gray-500">เชื่อมต่อสำเร็จแล้ว</p>
      </div>
    </main>
  );
}
