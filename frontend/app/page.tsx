import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">G</span>
          </div>
          <span className="text-lg font-bold tracking-wide text-zinc-50">Growthloop AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-full text-sm font-medium text-zinc-400 hover:text-zinc-50 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 rounded-full text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            สมัครสมาชิก
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center text-center px-6 py-28 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-violet-600/8 blur-[140px]" />
        </div>
        <div className="pointer-events-none absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-violet-500/5 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/5 blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-400">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            AI-Powered Marketing Platform
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl text-zinc-50">
            สร้างคอนเทนต์{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #c4b5fd 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AI ที่ปัง
            </span>
            <br />
            ด้วยพลัง Growthloop AI
          </h1>

          <p className="max-w-xl text-base text-zinc-400 leading-relaxed">
            แพลตฟอร์ม AI Marketing อัจฉริยะที่เข้าใจแบรนด์คุณ
            สร้างโพสต์ วิเคราะห์กลุ่มเป้าหมาย และกำหนดกลยุทธ์
            ให้ธุรกิจของคุณเติบโตอย่างอัตโนมัติ
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href="/register"
              className="px-8 py-3 rounded-full text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors shadow-lg shadow-violet-500/20"
            >
              เริ่มต้นฟรี →
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 rounded-full text-sm font-semibold border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-50 bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
          </div>

          <p className="text-[13px] text-zinc-600 mt-1">ไม่ต้องใช้บัตรเครดิต · เริ่มใช้งานได้เลย</p>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-zinc-800 bg-zinc-900/40 px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-zinc-50">ทุกอย่างที่ธุรกิจคุณต้องการ</h2>
            <p className="mt-2 text-[15px] text-zinc-500">จัดการ Marketing ได้ครบในที่เดียว</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <FeatureCard
              icon="✦"
              title="AI เขียนคอนเทนต์"
              desc="สร้างโพสต์ที่ตรงกับโทนแบรนด์และกลุ่มเป้าหมายอัตโนมัติ ทุกแพลตฟอร์ม"
            />
            <FeatureCard
              icon="◈"
              title="วิเคราะห์แบรนด์"
              desc="AI เรียนรู้ธุรกิจของคุณ ตั้งแต่ CI สี ไปจนถึงเป้าหมายทางการตลาด"
            />
            <FeatureCard
              icon="⬡"
              title="กำหนดเป้าหมาย"
              desc="วัดผลและปรับกลยุทธ์แบบ real-time ให้ยอด awareness และ engagement พุ่ง"
            />
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="px-8 py-20 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl border border-violet-500/15 bg-gradient-to-br from-violet-600/10 via-zinc-900 to-indigo-600/10 p-10 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-full bg-violet-500/8 blur-[80px]" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-violet-400 mb-2">เชื่อมต่อกับแพลตฟอร์มที่คุณใช้</p>
            <h2 className="text-3xl font-bold mb-4 text-zinc-50">LINE & Facebook</h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">
              โพสต์อัตโนมัติไปยัง LINE Official Account และ Facebook Page
              ด้วยคอนเทนต์ที่ AI สร้างให้เหมาะกับแต่ละช่องทาง
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 rounded-full text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors"
            >
              เริ่มเชื่อมต่อเลย
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-8 py-6 text-center text-[13px] text-zinc-600">
        © 2026 Growthloop AI. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col gap-3 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all">
      <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
        <span className="text-violet-400 text-base">{icon}</span>
      </div>
      <h3 className="text-base font-semibold text-zinc-50">{title}</h3>
      <p className="text-[15px] text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}
