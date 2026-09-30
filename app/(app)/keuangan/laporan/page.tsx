import { requireSession } from "@/lib/auth";
import { dateRange, type Row } from "@/lib/business/metrics";
import { loadAll } from "@/lib/supabase/load-all";
import { PrintButton } from "@/components/print-button";

const money = (value: number) => "Rp " + new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const { supabase } = await requireSession(["Administrator", "Pemilik"]);
  const range = dateRange(await searchParams, undefined, 3660);
  let all: Row[];
  try { all = await loadAll(supabase, "v_buku_keuangan"); }
  catch { return <p role="alert" className="text-destructive">Laporan gagal dimuat. Periksa koneksi dan migration.</p>; }
  const rows = all.filter(row => String(row.tanggal) >= range.from && String(row.tanggal) <= range.to)
    .sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
  const income = rows.filter(row => row.tipe === "PEMASUKAN").reduce((sum, row) => sum + Number(row.nominal || 0), 0);
  const expense = rows.filter(row => row.tipe === "PENGELUARAN").reduce((sum, row) => sum + Number(row.nominal || 0), 0);
  const byCategory = new Map<string, { type: string; amount: number }>();
  for (const row of rows) {
    const name = String(row.nama_kategori || "-");
    const current = byCategory.get(name) || { type: String(row.tipe), amount: 0 };
    current.amount += Number(row.nominal || 0);
    byCategory.set(name, current);
  }
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold">Laporan keuangan</h1><p className="text-sm text-muted-foreground">Farm Tech · {range.from} sampai {range.to}</p></div>
    <form className="flex flex-wrap items-end gap-2 rounded-lg border p-3 print:hidden">
      <label className="text-sm">Periode<select name="period" defaultValue={range.period} className="ml-2 rounded-md border p-2"><option value="7">7 hari</option><option value="30">30 hari</option><option value="custom">Kustom</option></select></label>
      <label className="text-sm">Dari <input type="date" name="from" defaultValue={range.from} className="rounded-md border p-2" /></label>
      <label className="text-sm">Sampai <input type="date" name="to" defaultValue={range.to} className="rounded-md border p-2" /></label>
      <button className="rounded-md border px-4 py-2 text-sm">Terapkan</button><PrintButton />
    </form>
    {range.invalid && <p role="alert" className="text-sm text-destructive">Periode tidak valid. Ditampilkan 30 hari terakhir.</p>}
    <div className="grid gap-3 sm:grid-cols-3">{[["Pemasukan",income],["Pengeluaran",expense],["Saldo periode",income-expense]].map(([label,value]) => <div key={label} className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">{label}</p><strong className="text-xl">{money(Number(value))}</strong></div>)}</div>
    <section><h2 className="mb-2 font-semibold">Ringkasan per kategori</h2><div className="overflow-x-auto rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr><th className="p-2">Kategori</th><th className="p-2">Tipe</th><th className="p-2 text-right">Total</th></tr></thead><tbody>{[...byCategory].map(([name, value]) => <tr key={name} className="border-t"><td className="p-2">{name}</td><td className="p-2">{value.type}</td><td className="p-2 text-right">{money(value.amount)}</td></tr>)}</tbody></table>{!byCategory.size && <p className="p-3 text-sm text-muted-foreground">Belum ada transaksi pada periode ini.</p>}</div></section>
    <section><h2 className="mb-2 font-semibold">Daftar transaksi</h2><div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-muted"><tr>{["Tanggal","Tipe","Kategori","Keterangan","Nominal"].map(x => <th key={x} className="p-2">{x}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={String(row.id_transaksi)} className="border-t"><td className="p-2">{String(row.tanggal)}</td><td className="p-2">{String(row.tipe)}</td><td className="p-2">{String(row.nama_kategori)}</td><td className="p-2">{String(row.keterangan || "-")}</td><td className="p-2 text-right">{money(Number(row.nominal || 0))}</td></tr>)}</tbody></table>{!rows.length && <p className="p-3 text-sm text-muted-foreground">Belum ada transaksi pada periode ini.</p>}</div></section>
  </div>;
}
