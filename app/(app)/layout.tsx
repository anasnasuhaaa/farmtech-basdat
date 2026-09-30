import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireSession();
  return <AppShell role={role}>{children}</AppShell>;
}
