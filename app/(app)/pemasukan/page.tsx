import { requireSession } from "@/lib/auth";
import { jakartaToday } from "@/lib/business/metrics";
import { saveIncome } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/page-header";
import { FeedbackToast } from "@/components/feedback-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function IncomePage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await requireSession(["ABK"]);
  const message = await searchParams;
  return <div className="max-w-2xl space-y-6">
    <FeedbackToast success={message.success} error={message.error} />
    <PageHeader title="Catat pemasukan lainnya" parent={{ label: "Dashboard", href: "/dashboard" }} description="Catatan ini masuk ke buku keuangan. Riwayat lengkap tersedia bagi Administrator dan Pemilik." />
    <Card><CardHeader><CardTitle>Informasi pemasukan</CardTitle><CardDescription>Isi tanggal, nominal, dan keterangan transaksi.</CardDescription></CardHeader><CardContent><form action={saveIncome} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="income-date">Tanggal</Label><Input id="income-date" name="tanggal" type="date" required defaultValue={jakartaToday()} /></div>
      <div className="space-y-2"><Label htmlFor="income-amount">Nominal (Rp)</Label><Input id="income-amount" name="nominal" type="number" min="0.01" step="0.01" required /></div></div>
      <div className="space-y-2"><Label htmlFor="income-note">Keterangan</Label><Textarea id="income-note" name="keterangan" rows={4} /></div>
      <div className="flex justify-end border-t pt-4"><SubmitButton className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Simpan pemasukan</SubmitButton></div>
    </form></CardContent></Card>
  </div>;
}
