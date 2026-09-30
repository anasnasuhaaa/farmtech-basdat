import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { recordMutation, moveCage } from "./actions";
export default async function PopulationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const { id } = await params; const message = await searchParams;
  const { supabase, role } = await requireSession();
  const [{ data: population }, { data: mutations }, { data: cages }] = await Promise.all([
    supabase.from("v_populasi_aktif").select("*").eq("id_populasi", id).single(),
    supabase.from("mutasi_populasi").select("*").eq("id_populasi", id).order("no_mutasi"),
    supabase.from("kandang").select("id_kandang,nama_kandang"),
  ]);
  if (!population) notFound();
  return <div className="space-y-6"><Link href="/peternakan/populasi" className="text-sm underline">← Populasi</Link><h1 className="text-2xl font-semibold">Detail populasi</h1>
    <p>Kandang: {cages?.find(x => x.id_kandang===population.id_kandang)?.nama_kandang || "-"} · Jumlah awal: {population.jumlah_awal} · Aktif: <strong>{population.jumlah_aktif}</strong></p>
    {message.error && <p role="alert" className="text-destructive">{message.error}</p>}{message.success && <p role="status">{message.success}</p>}
    {role !== "Pemilik" && <form action={recordMutation.bind(null,id)} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"><h2 className="sm:col-span-2 font-semibold">Catat mutasi</h2>
      <label>Tanggal<input required type="date" name="tanggal" defaultValue={new Date().toISOString().slice(0,10)} className="block w-full rounded-md border p-2" /></label>
      <label>Jenis<select required name="jenis_mutasi" className="block w-full rounded-md border p-2">{["KEMATIAN","PENJUALAN","PEMINDAHAN","AFKIR"].map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Jumlah<input required min="1" type="number" name="jumlah" className="block w-full rounded-md border p-2" /></label>
      <label>Keterangan<input name="keterangan" className="block w-full rounded-md border p-2" /></label><button className="rounded-md bg-primary p-2 text-primary-foreground">Simpan mutasi</button></form>}
    {role === "Administrator" && <form action={moveCage.bind(null,id)} className="flex flex-wrap gap-2 rounded-lg border p-4"><select required name="id_kandang" defaultValue={population.id_kandang} className="rounded-md border p-2">{cages?.map(x=><option key={x.id_kandang} value={x.id_kandang}>{x.nama_kandang}</option>)}</select><button className="rounded-md border px-3">Pindahkan seluruh kelompok</button></form>}
    <div className="rounded-lg border"><h2 className="border-b p-3 font-semibold">Riwayat mutasi</h2>{mutations?.length ? mutations.map(x=><p key={x.no_mutasi} className="border-b p-3 text-sm">#{x.no_mutasi} · {x.tanggal} · {x.jenis_mutasi} · {x.jumlah} ekor</p>) : <p className="p-3 text-sm text-muted-foreground">Belum ada mutasi.</p>}</div>
  </div>;
}
