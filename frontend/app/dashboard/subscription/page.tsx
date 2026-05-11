import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import UserSidebar from "@/components/UserSidebar";
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

  async function logout() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    redirect("/login");
  }

  const currentPlan = (user.plan ?? "free") as "free" | "pro" | "enterprise";

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <UserSidebar activePage="subscription" logoutAction={logout} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-6 shrink-0">
          <h1 className="text-base font-semibold text-zinc-200">Subscription</h1>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <p className="text-[15px] text-zinc-500">เลือกแผนที่เหมาะกับธุรกิจของคุณ</p>
          </div>
          <PlanSelector currentPlan={currentPlan} />
        </main>
      </div>
    </div>
  );
}
