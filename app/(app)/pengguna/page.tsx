import { requireSession } from "@/lib/auth";
import { updateUser } from "./actions";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const { supabase } = await requireSession(["Administrator"]);
  const message = await searchParams;
  const [{ data: users }, { data: admins }, { data: owners }, { data: workers }] = await Promise.all([
    supabase.from("pengguna").select("id_pengguna,nama,email,status_akun").order("email"),
    supabase.from("administrator").select("id_pengguna"),
    supabase.from("pemilik").select("id_pengguna"),
    supabase.from("abk").select("id_pengguna"),
  ]);
  const role = (id: string) => admins?.some(x => x.id_pengguna===id) ? "Administrator" : owners?.some(x => x.id_pengguna===id) ? "Pemilik" : workers?.some(x => x.id_pengguna===id) ? "ABK" : "-";
  return <div className="space-y-5"><h1 className="text-2xl font-semibold">Pengguna</h1>
    <p className="text-sm text-muted-foreground">Identitas baru dibuat melalui Supabase Authentication. Di sini Anda dapat mengubah profil, status, dan role.</p>
    {message.error && <p role="alert" className="text-destructive">{message.error}</p>}{message.success && <p role="status">{message.success}</p>}
    <div className="space-y-3">{users?.map(user => <form key={user.id_pengguna} action={updateUser} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <input type="hidden" name="id" value={user.id_pengguna} />
      <div className="min-w-0"><p className="truncate text-sm font-medium">{user.email}</p><label className="text-xs">Nama<input name="nama" defaultValue={user.nama} required className="mt-1 w-full rounded-md border p-2 text-sm" /></label></div>
      <label className="text-xs">Role<select name="role" defaultValue={role(user.id_pengguna)} className="mt-1 w-full rounded-md border p-2 text-sm">{["Administrator","Pemilik","ABK"].map(x => <option key={x}>{x}</option>)}</select></label>
      <label className="text-xs">Status<select name="status" defaultValue={user.status_akun} className="mt-1 w-full rounded-md border p-2 text-sm"><option>AKTIF</option><option>NONAKTIF</option></select></label>
      <button className="self-end rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Simpan</button>
    </form>)}</div>
    {!users?.length && <p className="text-sm text-muted-foreground">Belum ada profil. Login akun demo terlebih dahulu.</p>}
  </div>;
}
