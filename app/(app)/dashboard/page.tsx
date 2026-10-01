import Link from "next/link";
import { ArrowUpRight, Boxes, Egg, Gauge, Sprout, UsersRound, WalletCards, Wheat } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { dailyMetrics, dateRange, jakartaToday } from "@/lib/business/metrics";
import { formatDate, formatMetric, formatMoney, formatNumber } from "@/lib/format";
import { loadAll } from "@/lib/supabase/load-all";
import { DashboardCharts } from "@/components/dashboard-charts";
import { FormSelect } from "@/components/form-select";
import { MetricCard } from "@/components/metric-card";
import { BentoCard } from "@/components/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const { supabase, role } = await requireSession();
  const range = dateRange(await searchParams);
  let data;
  try {
    const [populations, mutations, harvests, feedIssues, feedStock, finance, categories] = await Promise.all([
      loadAll(supabase, "populasi_ternak"), loadAll(supabase, "mutasi_populasi"),
      loadAll(supabase, "panen"), loadAll(supabase, "pengeluaran_pakan"),
      loadAll(supabase, "v_stok_pakan"), role === "ABK" ? Promise.resolve([]) : loadAll(supabase, "v_buku_keuangan"), loadAll(supabase, "kategori_ternak"),
    ]);
    data = { populations, mutations, harvests, feedIssues, feedStock, finance, categories };
  } catch {
    return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Dashboard gagal dimuat. Periksa koneksi dan urutan migration.</div>;
  }
  const layerIds = new Set(data.categories.filter(row => row.nama_kategori === "Ayam Petelur").map(row => String(row.id_kategori_ternak)));
  const days = dailyMetrics(range.from, range.to, data.populations, data.mutations, data.harvests, data.feedIssues, data.finance, layerIds);
  const today = jakartaToday();
  const latest = range.to === today ? days.at(-1)! : dailyMetrics(today, today, data.populations, data.mutations, data.harvests, data.feedIssues, data.finance, layerIds)[0];
  const totalEggs = days.reduce((sum, day) => sum + day.eggs, 0);
  const stockKg = data.feedStock.reduce((sum, row) => sum + Number(row.stok_kg || 0), 0);
  const cash = data.finance.reduce((sum, row) => sum + Number(row.nominal_bertanda || 0), 0);
  const cards = [
    { label: "Populasi tercatat", value: formatNumber(latest.population), detail: "Ekor · seluruh kategori", icon: UsersRound },
    { label: "Stok pakan", value: formatNumber(stockKg, true), detail: "Kilogram", icon: Boxes, tone: "earth" as const },
    ...(role === "ABK" ? [] : [{ label: "Saldo tercatat", value: formatMoney(cash), detail: "Akumulasi buku keuangan", icon: WalletCards }]),
  ];
  return <div className="space-y-6">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
      <BentoCard featured className="relative overflow-hidden"><Sprout className="absolute -right-8 -top-8 size-48 rotate-12 opacity-10" /><div className="relative"><p className="text-sm font-medium text-primary-foreground/75">Operasional peternakan</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Selamat datang di Farm Tech</h1><p className="mt-3 text-sm text-primary-foreground/75">{formatDate(range.from)} – {formatDate(range.to)}</p><div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-primary-foreground/75">Panen petelur pada periode ini</p><strong className="text-4xl font-semibold tabular-nums sm:text-5xl">{formatNumber(totalEggs)}</strong><span className="ml-2 text-sm">butir</span></div><Link href="/telur/panen" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold hover:bg-white/25">Lihat panen <ArrowUpRight className="size-4" /></Link></div></div></BentoCard>
      <BentoCard className="print:hidden"><h2 className="font-semibold">Periode data</h2><form className="mt-4 grid gap-3"><div className="grid gap-1 text-xs font-medium text-muted-foreground"><span>Rentang</span><FormSelect id="dashboard-period" name="period" placeholder="Pilih periode" defaultValue={range.period} className="h-9 w-full bg-card" options={[{ id: "7", label: "7 hari" }, { id: "30", label: "30 hari" }, { id: "custom", label: "Kustom" }]} /></div><div className="grid grid-cols-2 gap-2"><label className="grid min-w-0 gap-1 text-xs font-medium text-muted-foreground">Dari<Input type="date" name="from" defaultValue={range.from} className="h-9 min-w-0 bg-card" /></label><label className="grid min-w-0 gap-1 text-xs font-medium text-muted-foreground">Sampai<Input type="date" name="to" defaultValue={range.to} className="h-9 min-w-0 bg-card" /></label></div><Button type="submit" className="h-9">Terapkan</Button></form></BentoCard>
    </div>
    {range.invalid && <p role="alert" className="text-sm text-destructive">Periode tidak valid. Ditampilkan 30 hari terakhir (maksimal 90 hari).</p>}
    {(latest.partial || latest.populationInconsistent) && <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">{latest.populationInconsistent ? "Data populasi tidak konsisten; HDP/HHP disembunyikan." : "Sebagian data di luar cakupan metrik petelur atau berat telur retak belum tercatat."} <Link href="/telur/panen" className="font-semibold underline underline-offset-2">Periksa panen</Link></p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><BentoCard className="flex flex-col justify-between bg-secondary"><div className="flex items-center justify-between"><p className="text-sm font-medium">Panen hari ini</p><Egg className="size-5 text-primary" /></div><div className="mt-8"><strong className="block text-3xl font-semibold tabular-nums">{formatNumber(latest.eggs)}</strong><p className="text-xs text-muted-foreground">Butir · kandang petelur</p></div></BentoCard>{cards.map(card => <MetricCard key={card.label} {...card} />)}</div>
    <BentoCard><div className="mb-4 flex items-center gap-2"><Gauge className="size-5 text-primary" /><div><h2 className="font-semibold">Indikator produksi hari ini</h2><p className="text-xs text-muted-foreground">Rumus demo dan batasan data dijelaskan di bawah setiap angka.</p></div></div><div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl bg-secondary/70 p-4"><span className="text-xs font-medium text-muted-foreground">HDP · proksi</span><strong className="mt-2 block text-2xl tabular-nums">{formatMetric(latest.hdp, "%")}</strong><p className="mt-1 text-xs text-muted-foreground">Telur / petelur hidup</p></div><div className="rounded-xl bg-muted p-4"><span className="text-xs font-medium text-muted-foreground">HHP harian demo</span><strong className="mt-2 block text-2xl tabular-nums">{formatMetric(latest.hhp, "%")}</strong><p className="mt-1 text-xs text-muted-foreground">Telur / jumlah awal kohort</p></div><div className="rounded-xl bg-muted p-4"><span className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><Wheat className="size-4" />FCR estimasi</span><strong className="mt-2 block text-2xl tabular-nums">{formatMetric(latest.fcr)}</strong><p className="mt-1 text-xs text-muted-foreground">Pakan keluar / berat telur utuh</p></div></div></BentoCard>
    <DashboardCharts days={days} showFinance={role !== "ABK"} />
    <details className="rounded-[1.4rem] border bg-card p-5 open:shadow-sm"><summary className="cursor-pointer font-semibold">Rincian harian <span className="ml-2 text-sm font-normal text-muted-foreground">{days.length} hari</span></summary><div className="mt-5 overflow-x-auto"><Table className="min-w-[780px]"><TableHeader><TableRow>{["Tanggal", "Populasi", "Telur", "Pakan kg", "HDP", "HHP", "FCR", ...(role === "ABK" ? [] : ["Pemasukan", "Pengeluaran"])].map(label => <TableHead key={label} className={label === "Tanggal" ? "" : "text-right"}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{days.map(day => <TableRow key={day.date}><TableCell>{formatDate(day.date)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(day.population)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(day.eggs)}</TableCell><TableCell className="text-right tabular-nums">{formatNumber(day.feedKg, true)}</TableCell><TableCell className="text-right tabular-nums">{formatMetric(day.hdp, "%")}</TableCell><TableCell className="text-right tabular-nums">{formatMetric(day.hhp, "%")}</TableCell><TableCell className="text-right tabular-nums">{formatMetric(day.fcr)}</TableCell>{role !== "ABK" && <><TableCell className="text-right tabular-nums">{formatMoney(day.income)}</TableCell><TableCell className="text-right tabular-nums">{formatMoney(day.expense)}</TableCell></>}</TableRow>)}</TableBody></Table></div></details>
  </div>;
}
