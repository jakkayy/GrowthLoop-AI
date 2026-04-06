import { createAdminClient } from "@/lib/supabase-admin";
import TestPage from "./TestPage";

export default async function AdminTestPage() {
  const supabase = createAdminClient();
  const { data: users } = await supabase
    .from("users")
    .select("user_id, full_name, brand_name")
    .eq("role", "user")
    .order("brand_name", { ascending: true });

  return <TestPage users={users ?? []} />;
}
