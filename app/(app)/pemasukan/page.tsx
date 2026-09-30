import { requireSession } from "@/lib/auth";
import { saveIncome } from "./actions";

export default async function IncomePage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireSession(["ABK"]);
  const message = await searchParams;
  return <div className="max-w-xl space-y-5">
    <h1 className="text-2xl font-semibold">Catat pemasukan lainnya</h1>
    <p className="text-sm text-muted-foreground">Catatan ini masuk ke buku keuangan. Riwayat lengkap hanya tersedia bagi Administrator dan Pemilik.</p>
    {message.error && <p role="alert" className="text-destructive">{message.error}</p>}
    {message.success && <p role="status">{message.success}</p>}
    <form action={saveIncome} className="space-y-4 rounded-lg border p-4">
      <label className="block text-sm">Tanggal<input name="tanggal" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className="mt-1 w-full rounded-md border p-2" /></label>
      <label className="block text-sm">Nominal (Rp)<input name="nominal" type="number" min="0.01" step="0.01" required className="mt-1 w-full rounded-md border p-2" /></label>
      <label className="block text-sm">Keterangan<textarea name="keterangan" className="mt-1 w-full rounded-md border p-2" /></label>
      <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Simpan pemasukan</button>
    </form>
  </div>;
}
