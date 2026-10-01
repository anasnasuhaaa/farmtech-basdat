import { UsersRound } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { updateUser } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { FeedbackToast } from "@/components/feedback-toast";
import { FormSelect } from "@/components/form-select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const { supabase } = await requireSession(["Administrator"]);
  const message = await searchParams;
  const [{ data: users }, { data: admins }, { data: owners }, { data: workers }] = await Promise.all([
    supabase.from("pengguna").select("id_pengguna,nama,email,status_akun").order("email"),
    supabase.from("administrator").select("id_pengguna"),
    supabase.from("pemilik").select("id_pengguna"),
    supabase.from("abk").select("id_pengguna"),
  ]);
  const role = (id: string) => admins?.some(item => item.id_pengguna === id) ? "Administrator" : owners?.some(item => item.id_pengguna === id) ? "Pemilik" : workers?.some(item => item.id_pengguna === id) ? "ABK" : "—";
  return <div className="space-y-6">
    <FeedbackToast success={message.success} error={message.error} />
    <PageHeader title="Pengguna" parent={{ label: "Sistem", href: "/dashboard" }} description="Kelola profil, status, dan role pengguna. Identitas baru dibuat melalui Supabase Authentication." />
    {users?.length ? <div className="grid gap-4 xl:grid-cols-2">{users.map(user => <Card key={user.id_pengguna}><CardHeader className="flex flex-row items-center gap-3"><Avatar className="size-10"><AvatarFallback className="bg-secondary text-primary">{(user.nama || user.email || "?").slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><CardTitle className="truncate">{user.nama || "Tanpa nama"}</CardTitle><CardDescription className="truncate">{user.email}</CardDescription></div><StatusBadge value={user.status_akun} /></CardHeader><CardContent>
      <form action={updateUser} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="id" value={user.id_pengguna} />
        <div className="space-y-2 sm:col-span-2"><Label htmlFor={`user-name-${user.id_pengguna}`}>Nama</Label><Input id={`user-name-${user.id_pengguna}`} name="nama" defaultValue={user.nama} required /></div>
        <div className="space-y-2"><Label htmlFor={`user-role-${user.id_pengguna}`}>Role</Label><FormSelect id={`user-role-${user.id_pengguna}`} name="role" placeholder="Pilih role" defaultValue={role(user.id_pengguna)} options={["Administrator", "Pemilik", "ABK"].map(value => ({ id: value, label: value }))} /></div>
        <div className="space-y-2"><Label htmlFor={`user-status-${user.id_pengguna}`}>Status</Label><FormSelect id={`user-status-${user.id_pengguna}`} name="status" placeholder="Pilih status" defaultValue={user.status_akun} options={[{ id: "AKTIF", label: "Aktif" }, { id: "NONAKTIF", label: "Nonaktif" }]} /></div>
        <div className="flex justify-end sm:col-span-2"><SubmitButton className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Simpan perubahan</SubmitButton></div>
      </form>
    </CardContent></Card>)}</div> : <EmptyState icon={UsersRound} title="Belum ada profil" description="Login akun demo terlebih dahulu untuk membuat profil." />}
  </div>;
}
