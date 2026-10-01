import { notFound } from "next/navigation";
import { ArrowRightLeft, Bird, CalendarDays, UsersRound } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { jakartaToday } from "@/lib/business/metrics";
import { formatDate, formatNumber } from "@/lib/format";
import { recordMutation, moveCage } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { FeedbackToast } from "@/components/feedback-toast";
import { FormSelect } from "@/components/form-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";

export default async function PopulationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const { id } = await params;
  const message = await searchParams;
  const { supabase, role } = await requireSession();
  const [{ data: population }, { data: mutations }, { data: cages }] = await Promise.all([
    supabase.from("v_populasi_aktif").select("*").eq("id_populasi", id).single(),
    supabase.from("mutasi_populasi").select("*").eq("id_populasi", id).order("no_mutasi"),
    supabase.from("kandang").select("id_kandang,nama_kandang"),
  ]);
  if (!population) notFound();
  const cage = cages?.find(item => item.id_kandang === population.id_kandang)?.nama_kandang || "Kandang tidak ditemukan";
  return <div className="space-y-6">
    <FeedbackToast success={message.success} error={message.error} />
    <PageHeader title={`Populasi #${String(population.id_populasi).slice(0, 8)}`} parent={{ label: "Populasi", href: "/peternakan/populasi" }} description={`${cage} · ${population.ras || "Ternak"}`} />
    <div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Jumlah awal" value={formatNumber(Number(population.jumlah_awal))} detail="Ekor" icon={Bird} /><MetricCard label="Jumlah aktif" value={formatNumber(Number(population.jumlah_aktif))} detail="Ekor" icon={UsersRound} /><MetricCard label="Tanggal masuk" value={formatDate(String(population.tanggal_masuk))} icon={CalendarDays} /></div>
    <div className="grid gap-4 lg:grid-cols-2">
      {role !== "Pemilik" && <Card><CardHeader><CardTitle>Catat mutasi</CardTitle></CardHeader><CardContent><form action={recordMutation.bind(null, id)} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="mutation-date">Tanggal</Label><Input id="mutation-date" required type="date" name="tanggal" defaultValue={jakartaToday()} /></div>
        <div className="space-y-2"><Label htmlFor="mutation-type">Jenis</Label><FormSelect id="mutation-type" required name="jenis_mutasi" placeholder="Pilih jenis" defaultValue="KEMATIAN" options={["KEMATIAN", "PENJUALAN", "PEMINDAHAN", "AFKIR"].map(type => ({ id: type, label: type.replaceAll("_", " ") }))} /></div>
        <div className="space-y-2"><Label htmlFor="mutation-count">Jumlah</Label><Input id="mutation-count" required min="1" type="number" name="jumlah" /></div>
        <div className="space-y-2"><Label htmlFor="mutation-note">Keterangan</Label><Input id="mutation-note" name="keterangan" /></div>
        <SubmitButton className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground sm:col-span-2">Simpan mutasi</SubmitButton>
      </form></CardContent></Card>}
      {role === "Administrator" && <Card><CardHeader><CardTitle>Pindahkan kelompok</CardTitle></CardHeader><CardContent><form action={moveCage.bind(null, id)} className="space-y-4"><div className="space-y-2"><Label htmlFor="move-cage">Kandang tujuan</Label><FormSelect id="move-cage" required name="id_kandang" placeholder="Pilih kandang" defaultValue={population.id_kandang} options={(cages || []).map(item => ({ id: String(item.id_kandang), label: item.nama_kandang }))} /></div><SubmitButton className="h-9 rounded-lg border px-4 text-sm font-medium">Pindahkan seluruh kelompok</SubmitButton></form></CardContent></Card>}
    </div>
    <Card><CardHeader><CardTitle>Riwayat mutasi</CardTitle></CardHeader><CardContent>{mutations?.length ? <ol className="space-y-3">{mutations.map(item => <li key={item.no_mutasi} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm"><span className="flex size-8 items-center justify-center rounded-lg bg-muted"><ArrowRightLeft className="size-4" /></span><div className="min-w-28 flex-1"><strong className="block">#{item.no_mutasi} · {formatDate(String(item.tanggal))}</strong><span className="text-muted-foreground">{item.keterangan || "Tanpa keterangan"}</span></div><StatusBadge value={item.jenis_mutasi} /><strong className="tabular-nums">{formatNumber(Number(item.jumlah))} ekor</strong></li>)}</ol> : <EmptyState icon={ArrowRightLeft} title="Belum ada mutasi" description="Riwayat perubahan populasi akan tampil di sini." />}</CardContent></Card>
  </div>;
}
