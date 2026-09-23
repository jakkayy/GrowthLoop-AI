import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { getSession, logout } from "@/lib/getSession";
import UserSidebar from "@/components/UserSidebar";
import PlanSelector from "./PlanSelector";

// Service-role client: this Server Component already resolves the
// caller's session before touching the DB, so bypassing RLS here is
// intentional.
const supabase = createAdminClient();

export default async function SubscriptionPage() {
  const { userId } = await getSession();

  const { data: user } = await supabase
    .from("users")
    .select("full_name, brand_name, plan")
    .eq("user_id", userId)
    .single();

  if (!user) redirect("/login");

  const currentPlan = (user.plan ?? "free") as "free" | "pro" | "enterprise";

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <UserSidebar activePage="subscription" logoutAction={logout} />

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
