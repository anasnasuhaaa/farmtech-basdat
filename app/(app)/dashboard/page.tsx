import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { dailyMetrics, dateRange } from "@/lib/business/metrics";
import { loadAll } from "@/lib/supabase/load-all";

const num = (value: number, digits = 0) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits }).format(value);
const metric = (value: number | null, suffix = "") => value === null ? "-" : `${num(value, 2)}${suffix}`;

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
    return <div role="alert" className="rounded-md border p-4">Dashboard gagal dimuat. Periksa koneksi dan urutan migration.</div>;
  }
  const days = dailyMetrics(range.from, range.to, data.populations, data.mutations, data.harvests, data.feedIssues, data.finance);
  const latest = days.at(-1)!;
  const totalEggs = days.reduce((sum, day) => sum + day.eggs, 0);
  const stockKg = data.feedStock.reduce((sum, row) => sum + Number(row.stok_kg || 0), 0);
  const cash = data.finance.reduce((sum, row) => sum + Number(row.nominal_bertanda || 0), 0);
  const cards = [
    ["HDP hari ini", metric(latest.hdp, "%")], ["HHP hari ini", metric(latest.hhp, "%")],
    ["FCR hari ini", metric(latest.fcr)], ["Populasi aktif", num(latest.population)],
    ["Panen hari ini", num(latest.eggs) + " butir"], ["Stok pakan", num(stockKg, 3) + " kg"],
    ...(role === "ABK" ? [] : [["Saldo kas", "Rp " + num(cash, 2)]]),
  ];
  const maxEggs = Math.max(1, ...days.map(day => day.eggs));
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold">Dashboard</h1><p className="text-sm text-muted-foreground">Ringkasan {range.from} hingga {range.to}</p></div>
    <form className="flex flex-wrap items-end gap-2 rounded-lg border p-3 print:hidden">
      <label className="text-sm">Periode<select name="period" defaultValue={range.period} className="ml-2 rounded-md border p-2"><option value="7">7 hari</option><option value="30">30 hari</option><option value="custom">Kustom</option></select></label>
      <label className="text-sm">Dari <input type="date" name="from" defaultValue={range.from} className="rounded-md border p-2" /></label>
      <label className="text-sm">Sampai <input type="date" name="to" defaultValue={range.to} className="rounded-md border p-2" /></label>
      <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Terapkan</button>
    </form>
    {range.invalid && <p role="alert" className="text-sm text-destructive">Periode tidak valid. Ditampilkan 30 hari terakhir (maksimal 90 hari).</p>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">{label}</p><strong className="mt-2 block text-xl">{value}</strong></div>)}</div>
    <p className="text-sm">Panen selama periode: <strong>{num(totalEggs)} butir</strong>. <Link href="/telur/panen" className="underline">Lihat panen</Link></p>
    <div className="rounded-lg border p-4"><h2 className="font-semibold">Tren produksi telur</h2><div className="mt-3 space-y-2">{days.slice(-14).map(day => <div key={day.date} className="grid grid-cols-[5.5rem_1fr_4rem] items-center gap-3 text-xs"><span>{day.date.slice(5)}</span><div className="h-3 rounded-sm bg-muted"><div className="h-full rounded-sm bg-primary" style={{ width: `${day.eggs / maxEggs * 100}%` }} /></div><span className="text-right">{num(day.eggs)}</span></div>)}</div><p className="mt-2 text-xs text-muted-foreground">14 hari terakhir dari periode terpilih.</p></div>
    <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-muted"><tr>{["Tanggal","Populasi","Telur","Pakan kg","HDP","HHP","FCR",...(role === "ABK" ? [] : ["Pemasukan","Pengeluaran"])].map(x => <th key={x} className="p-2">{x}</th>)}</tr></thead><tbody>{days.map(day => <tr key={day.date} className="border-t"><td className="p-2">{day.date}</td><td className="p-2">{num(day.population)}</td><td className="p-2">{num(day.eggs)}</td><td className="p-2">{num(day.feedKg,3)}</td><td className="p-2">{metric(day.hdp,"%")}</td><td className="p-2">{metric(day.hhp,"%")}</td><td className="p-2">{metric(day.fcr)}</td>{role !== "ABK" && <><td className="p-2">{num(day.income,2)}</td><td className="p-2">{num(day.expense,2)}</td></>}</tr>)}</tbody></table></div>
  </div>;
}
