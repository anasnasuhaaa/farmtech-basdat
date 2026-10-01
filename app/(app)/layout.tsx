import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { role, user, supabase } = await requireSession();
  const { data: profile } = await supabase.from("pengguna").select("nama").eq("id_pengguna", user.id).maybeSingle();
  return <AppShell role={role} name={profile?.nama || user.email || role}>{children}</AppShell>;
}
