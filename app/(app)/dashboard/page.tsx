import Link from "next/link";
import { Boxes, Egg, Gauge, Sprout, UsersRound, WalletCards, Wheat } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { dailyMetrics, dateRange, jakartaToday } from "@/lib/business/metrics";
import { formatDate, formatMetric, formatMoney, formatNumber } from "@/lib/format";
import { loadAll } from "@/lib/supabase/load-all";
import { DashboardCharts } from "@/components/dashboard-charts";
import { FormSelect } from "@/components/form-select";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const { supabase, role } = await requireSession();
  const range = dateRange(await searchParams);
  let data;
  try {
    const [populations, mutations, harvests, feedIssues, feedStock, finance] = await Promise.all([
      loadAll(supabase, "populasi_ternak"), loadAll(supabase, "mutasi_populasi"),
      loadAll(supabase, "panen"), loadAll(supabase, "pengeluaran_pakan"),
      loadAll(supabase, "v_stok_pakan"), role === "ABK" ? Promise.resolve([]) : loadAll(supabase, "v_buku_keuangan"),
    ]);
    data = { populations, mutations, harvests, feedIssues, feedStock, finance };
  } catch {
    return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Dashboard gagal dimuat. Periksa koneksi dan urutan migration.</div>;
  }
  const days = dailyMetrics(range.from, range.to, data.populations, data.mutations, data.harvests, data.feedIssues, data.finance);
  const today = jakartaToday();
  const latest = range.to === today ? days.at(-1)! : dailyMetrics(today, today, data.populations, data.mutations, data.harvests, data.feedIssues, data.finance)[0];
  const totalEggs = days.reduce((sum, day) => sum + day.eggs, 0);
  const stockKg = data.feedStock.reduce((sum, row) => sum + Number(row.stok_kg || 0), 0);
  const cash = data.finance.reduce((sum, row) => sum + Number(row.nominal_bertanda || 0), 0);
  const cards = [
    { label: "HDP hari ini", value: formatMetric(latest.hdp, "%"), detail: latest.hdp === null ? "Belum ada data hari ini" : undefined, icon: Gauge },
    { label: "HHP hari ini", value: formatMetric(latest.hhp, "%"), detail: latest.hhp === null ? "Belum ada data hari ini" : undefined, icon: Egg },
    { label: "FCR hari ini", value: formatMetric(latest.fcr), detail: latest.fcr === null ? "Belum ada data hari ini" : undefined, icon: Wheat, tone: "earth" as const },
    { label: "Populasi aktif", value: formatNumber(latest.population), detail: "Ekor", icon: UsersRound },
    { label: "Panen hari ini", value: formatNumber(latest.eggs), detail: "Butir", icon: Egg, tone: "amber" as const },
    { label: "Stok pakan", value: formatNumber(stockKg, true), detail: "Kilogram", icon: Boxes, tone: "earth" as const },
    ...(role === "ABK" ? [] : [{ label: "Saldo kas", value: formatMoney(cash), icon: WalletCards }]),
  ];
  return <div className="space-y-6">
    <PageHeader title="Dashboard" description="Ringkasan operasional peternakan." action={<span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs text-muted-foreground"><Sprout className="size-4 text-primary" />{formatDate(range.from)} – {formatDate(range.to)}</span>} />
    <form className="flex flex-wrap items-end gap-2 print:hidden">
      <div className="grid gap-1 text-xs font-medium text-muted-foreground"><span>Periode</span><FormSelect id="dashboard-period" name="period" placeholder="Pilih periode" defaultValue={range.period} className="h-9 min-w-28 bg-card" options={[{ id: "7", label: "7 hari" }, { id: "30", label: "30 hari" }, { id: "custom", label: "Kustom" }]} /></div>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Dari<Input type="date" name="from" defaultValue={range.from} className="h-9 w-36 bg-card" /></label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Sampai<Input type="date" name="to" defaultValue={range.to} className="h-9 w-36 bg-card" /></label>
      <Button type="submit" className="h-9">Terapkan</Button>
    </form>
    {range.invalid && <p role="alert" className="text-sm text-destructive">Periode tidak valid. Ditampilkan 30 hari terakhir (maksimal 90 hari).</p>}
    <div className="grid gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{cards.map(card => <MetricCard key={card.label} {...card} />)}</div>
    <p className="text-sm text-muted-foreground">Panen selama periode: <strong className="text-foreground">{formatNumber(totalEggs)} butir</strong>. <Link href="/telur/panen" className="font-medium text-primary underline underline-offset-2">Lihat panen</Link></p>
    <DashboardCharts days={days} showFinance={role !== "ABK"} />
    <Card><CardHeader><CardTitle>Rincian harian</CardTitle><CardDescription>Angka dasar untuk membaca tren pada periode terpilih.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><Table className="min-w-[780px]"><TableHeader><TableRow>{["Tanggal", "Populasi", "Telur", "Pakan kg", "HDP", "HHP", "FCR", ...(role === "ABK" ? [] : ["Pemasukan", "Pengeluaran"])].map(label => <TableHead key={label} className={label === "Tanggal" ? "" : "text-right"}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{days.map(day => <TableRow key={day.date}><TableCell>{formatDate(day.date)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(day.population)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(day.eggs)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(day.feedKg, true)}</TableCell><TableCell className="text-right tabular-nums">{formatMetric(day.hdp, "%")}</TableCell><TableCell className="text-right tabular-nums">{formatMetric(day.hhp, "%")}</TableCell><TableCell className="text-right tabular-nums">{formatMetric(day.fcr)}</TableCell>{role !== "ABK" && <><TableCell className="text-right tabular-nums">{formatMoney(day.income)}</TableCell><TableCell className="text-right tabular-nums">{formatMoney(day.expense)}</TableCell></>}</TableRow>)}</TableBody></Table></div></CardContent></Card>
  </div>;
}
