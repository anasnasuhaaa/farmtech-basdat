import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export type Role = "Administrator" | "Pemilik" | "ABK";
export async function getSession() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: role } = await supabase.rpc("current_role");
  if (!["Administrator", "Pemilik", "ABK"].includes(role as string)) return null;
  return { supabase, user, role: role as Role };
}
export async function requireSession(allowed?: Role[]) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (allowed && !allowed.includes(session.role)) redirect("/dashboard");
  return session;
}
