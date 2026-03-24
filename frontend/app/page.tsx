import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-green-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-lg font-bold tracking-wide text-gray-900">AXIS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 rounded-full text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            สมัครสมาชิก
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center text-center px-6 py-28 relative overflow-hidden">
        {/* Green glow blobs */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-green-200/60 blur-[130px]" />
        </div>
        <div className="pointer-events-none absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-emerald-200/40 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-teal-200/40 blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-xs font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            AI-Powered Marketing Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl text-gray-900">
            สร้างคอนเทนต์{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #059669 50%, #0d9488 100%)",
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

          <p className="max-w-xl text-base text-gray-500 leading-relaxed">
            แพลตฟอร์ม AI Marketing อัจฉริยะที่เข้าใจแบรนด์คุณ
            สร้างโพสต์ วิเคราะห์กลุ่มเป้าหมาย และกำหนดกลยุทธ์
            ให้ธุรกิจของคุณเติบโตอย่างอัตโนมัติ
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href="/register"
              className="px-8 py-3 rounded-full text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors shadow-lg shadow-green-200"
            >
              เริ่มต้นฟรี →
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 rounded-full text-sm font-semibold border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
          </div>

          {/* Social proof */}
          <p className="text-xs text-gray-400 mt-1">ไม่ต้องใช้บัตรเครดิต · เริ่มใช้งานได้เลย</p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-green-50 px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900">ทุกอย่างที่ธุรกิจคุณต้องการ</h2>
            <p className="mt-2 text-sm text-gray-500">จัดการ Marketing ได้ครบในที่เดียว</p>
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
        <div className="rounded-3xl bg-gradient-to-br from-green-600 to-emerald-700 p-10 text-white text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-full bg-white/10 blur-[80px]" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-green-100 mb-2">เชื่อมต่อกับแพลตฟอร์มที่คุณใช้</p>
            <h2 className="text-3xl font-bold mb-4">LINE & Facebook</h2>
            <p className="text-green-100 text-sm max-w-md mx-auto mb-8">
              โพสต์อัตโนมัติไปยัง LINE Official Account และ Facebook Page
              ด้วยคอนเทนต์ที่ AI สร้างให้เหมาะกับแต่ละช่องทาง
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 rounded-full text-sm font-semibold bg-white text-green-700 hover:bg-green-50 transition-colors"
            >
              เริ่มเชื่อมต่อเลย
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-8 py-6 text-center text-xs text-gray-400">
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
    <div className="rounded-2xl border border-green-100 bg-white p-6 flex flex-col gap-3 hover:border-green-300 hover:shadow-md hover:shadow-green-100 transition-all">
      <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center">
        <span className="text-green-600 text-base">{icon}</span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
