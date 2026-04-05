import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import PlanSelector from "./PlanSelector";

export default async function SubscriptionPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/login");

  let userId: string;
  try {
    const payload = verifyAccessToken(token);
    userId = payload.userId;
  } catch {
    redirect("/login");
  }

  const { data: user } = await supabase
    .from("users")
    .select("full_name, brand_name, plan")
    .eq("user_id", userId)
    .single();

  if (!user) redirect("/login");

  const currentPlan = (user.plan ?? "free") as "free" | "pro" | "enterprise";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white flex flex-col border-r border-gray-200">
        <div className="px-5 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div>
              <p className="text-gray-900 text-sm font-bold leading-tight">AXIS</p>
              <p className="text-[10px] text-green-600/70 tracking-widest">AI MARKETING</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
          >
            <span className="w-4 h-4 shrink-0"><GridIcon /></span>
            <span className="text-sm">Overview</span>
          </Link>
          <Link
            href="/dashboard/subscription"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700"
          >
            <span className="w-4 h-4 shrink-0"><SubscriptionIcon /></span>
            <span className="text-sm font-medium">Subscription</span>
          </Link>
          <Link
            href="/platform"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
          >
            <span className="w-4 h-4 shrink-0"><PlatformIcon /></span>
            <span className="text-sm">Connect Platform</span>
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
          <h1 className="text-base font-semibold text-gray-900">Subscription</h1>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <p className="text-sm text-gray-500">เลือกแผนที่เหมาะกับธุรกิจของคุณ</p>
          </div>
          <PlanSelector currentPlan={currentPlan} />
        </main>
      </div>
    </div>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function SubscriptionIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="10" rx="2" />
      <path d="M1 6h14" />
      <path d="M5 10h3M10 10h1" />
    </svg>
  );
}

function PlatformIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="10" rx="2" />
      <path d="M5 7l2 2 4-4" />
    </svg>
  );
}
