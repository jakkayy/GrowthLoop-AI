import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/8">
        <span className="text-xl font-bold tracking-widest text-white">AXIS</span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 rounded-full text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors"
          >
            สมัครสมาชิก
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center text-center px-6 py-32 relative overflow-hidden">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[480px] w-[480px] rounded-full bg-violet-600/20 blur-[120px]" />
        </div>
        <div className="pointer-events-none absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-indigo-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-purple-500/15 blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            AI-Powered Marketing Platform
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            สร้างคอนเทนต์{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #67e8f9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AI ที่ปัง
            </span>
            <br />
            ด้วยพลัง AXIS
          </h1>

          <p className="max-w-xl text-base text-white/50 leading-relaxed">
            แพลตฟอร์ม AI Marketing อัจฉริยะที่เข้าใจแบรนด์คุณ
            สร้างโพสต์ วิเคราะห์กลุ่มเป้าหมาย และกำหนดกลยุทธ์
            ให้ธุรกิจของคุณเติบโตอย่างอัตโนมัติ
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href="/register"
              className="px-7 py-3 rounded-full text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              เริ่มต้นฟรี
            </Link>
            <Link
              href="/login"
              className="px-7 py-3 rounded-full text-sm font-semibold border border-white/15 hover:border-white/30 text-white/80 hover:text-white transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-8 py-5 text-center text-xs text-white/25">
        © 2026 AXIS. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-6 flex flex-col gap-3 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors">
      <span className="text-violet-400 text-xl">{icon}</span>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-white/45 leading-relaxed">{desc}</p>
    </div>
  );
}
