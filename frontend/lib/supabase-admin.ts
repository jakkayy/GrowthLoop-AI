import { createClient } from "@supabase/supabase-js";

// Server-only client — ใช้ service role key เพื่อ bypass RLS
// ใช้ได้เฉพาะใน Server Components หรือ Route Handlers เท่านั้น
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
