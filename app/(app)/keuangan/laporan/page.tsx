import { ArrowDownLeft, ArrowUpRight, WalletCards } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { dateRange, type Row } from "@/lib/business/metrics";
import { formatDate, formatMoney } from "@/lib/format";
import { PrintButton } from "@/components/print-button";
import { PageHeader } from "@/components/page-header";
import { FormSelect } from "@/components/form-select";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const { supabase } = await requireSession(["Administrator", "Pemilik"]);
  const range = dateRange(await searchParams, undefined, 3660);
  const rows: Row[] = [];
  try {
    for (let offset = 0; ; offset += 1000) {
      const result = await supabase.from("v_buku_keuangan").select("*").gte("tanggal", range.from).lte("tanggal", range.to).order("tanggal").order("id_transaksi").range(offset, offset + 999);
      if (result.error) throw new Error("Laporan gagal dimuat");
      rows.push(...(result.data || []));
      if (!result.data || result.data.length < 1000) break;
    }
  }
  catch { return <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">Laporan gagal dimuat. Periksa koneksi dan migration.</p>; }
  const income = rows.filter(row => row.tipe === "PEMASUKAN").reduce((sum, row) => sum + Number(row.nominal || 0), 0);
  const expense = rows.filter(row => row.tipe === "PENGELUARAN").reduce((sum, row) => sum + Number(row.nominal || 0), 0);
  const byCategory = new Map<string, { name: string; type: string; amount: number }>();
  for (const row of rows) {
    const key = `${String(row.tipe)}:${String(row.id_kategori_keuangan)}`;
    const current = byCategory.get(key) || { name: String(row.nama_kategori || "—"), type: String(row.tipe), amount: 0 };
    current.amount += Number(row.nominal || 0);
    byCategory.set(key, current);
  }
  return <div className="space-y-6">
    <PageHeader title="Laporan keuangan" parent={{ label: "Keuangan", href: "/keuangan/transaksi" }} description={`Ringkasan transaksi ${formatDate(range.from)} – ${formatDate(range.to)}.`} action={<PrintButton />} />
    <form className="flex flex-wrap items-end gap-2 print:hidden">
      <div className="grid gap-1 text-xs font-medium text-muted-foreground"><span>Periode</span><FormSelect id="report-period" name="period" placeholder="Pilih periode" defaultValue={range.period} className="h-9 min-w-28 bg-card" options={[{ id: "7", label: "7 hari" }, { id: "30", label: "30 hari" }, { id: "custom", label: "Kustom" }]} /></div>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Dari<Input name="from" type="date" defaultValue={range.from} className="h-9 w-36 bg-card" /></label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Sampai<Input name="to" type="date" defaultValue={range.to} className="h-9 w-36 bg-card" /></label>
      <Button type="submit" variant="outline" className="h-9">Terapkan</Button>
    </form>
    {range.invalid && <p role="alert" className="text-sm text-destructive">Periode tidak valid. Ditampilkan 30 hari terakhir.</p>}
    <div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Total pemasukan" value={formatMoney(income)} icon={ArrowDownLeft} /><MetricCard label="Total pengeluaran" value={formatMoney(expense)} icon={ArrowUpRight} tone="earth" /><MetricCard label="Saldo periode" value={formatMoney(income - expense)} icon={WalletCards} /></div>
    <Card><CardHeader><CardTitle>Ringkasan per kategori</CardTitle><CardDescription>Akumulasi nominal untuk periode terpilih.</CardDescription></CardHeader><CardContent>{byCategory.size ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead>Tipe</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{[...byCategory].map(([key, value]) => <TableRow key={key}><TableCell className="font-medium">{value.name}</TableCell><TableCell><StatusBadge value={value.type} /></TableCell><TableCell className="text-right tabular-nums">{formatMoney(value.amount)}</TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState icon={WalletCards} title="Belum ada transaksi" description="Tidak ada transaksi pada periode ini." />}</CardContent></Card>
    <Card><CardHeader><CardTitle>Daftar transaksi</CardTitle><CardDescription>{rows.length} transaksi pada periode terpilih.</CardDescription></CardHeader><CardContent>{rows.length ? <div className="overflow-x-auto"><Table className="min-w-[620px]"><TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Tipe</TableHead><TableHead>Kategori</TableHead><TableHead>Keterangan</TableHead><TableHead className="text-right">Nominal</TableHead></TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={String(row.id_transaksi)}><TableCell>{formatDate(String(row.tanggal))}</TableCell><TableCell><StatusBadge value={String(row.tipe)} /></TableCell><TableCell>{String(row.nama_kategori)}</TableCell><TableCell className="max-w-64 truncate text-muted-foreground">{String(row.keterangan || "—")}</TableCell><TableCell className={`text-right font-medium tabular-nums ${row.tipe === "PENGELUARAN" ? "text-destructive" : "text-primary"}`}>{row.tipe === "PENGELUARAN" ? "−" : "+"}{formatMoney(Number(row.nominal || 0))}</TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState icon={WalletCards} title="Belum ada transaksi" description="Daftar transaksi pada periode ini masih kosong." />}</CardContent></Card>
  </div>;
}
