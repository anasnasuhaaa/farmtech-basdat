"use client";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Ellipsis, Plus, Search, Trash2 } from "lucide-react";
import type { Role } from "@/lib/auth";
import type { Field, Section } from "@/lib/sections";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { cancelSection, saveSection } from "./actions";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { FeedbackToast } from "@/components/feedback-toast";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FormSelect } from "@/components/form-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input as TextInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Props = { path: string; config: Section; rows: Record<string, unknown>[]; details: Record<string, unknown>[]; options: Record<string, { id: string; label: string; type?: string }[]>; role: Role; search: { q?: string; from?: string; to?: string; filter?: string; error?: string; success?: string; type?: string }; loadError: boolean; filterKey?: string; filterOptions: { id: string; label: string }[] };
type DetailItem = { id_pakan: string; berat_bahan: string; id_kategori_telur: string; jumlah_telur: string; harga_satuan: string };
const blankDetail = (): DetailItem => ({ id_pakan: "", berat_bahan: "", id_kategori_telur: "", jumlah_telur: "", harga_satuan: "" });
const readable = (value: string) => value.replace(/^id_/, "").replaceAll("_", " ").replace(/^./, letter => letter.toUpperCase());
const numeric = (column: string) => /^(jumlah|berat|stok|total|harga|nominal|usia)/.test(column);
const currency = (column: string) => /(harga|biaya|nominal)/.test(column);
const status = (value: string) => ["BAHAN_BAKU", "PAKAN_JADI", "HASIL_CAMPURAN", "PEMASUKAN", "PENGELUARAN", "KEMATIAN", "PENJUALAN", "PEMINDAHAN", "AFKIR"].includes(value);
function Submit({ label }: { label: string }) { const { pending } = useFormStatus(); return <Button disabled={pending}>{pending ? "Menyimpan..." : label}</Button>; }
function FieldInput({ field, options, defaultValue }: { field: Field; options: Props["options"]; defaultValue?: string }) {
  const id = `field-${field.name}`;
  return <div className="space-y-2"><Label htmlFor={id}>{field.label}</Label>{field.type === "select"
    ? <FormSelect id={id} name={field.name} required={field.required} defaultValue={defaultValue} placeholder={`Pilih ${field.label.toLowerCase()}`} options={(field.source ? options[field.source] || [] : (field.options || []).map(value => ({ id: value, label: value }))).map(item => ({ ...item, label: item.label.replaceAll("_", " ") }))} />
    : field.type === "textarea" ? <Textarea id={id} name={field.name} defaultValue={defaultValue} rows={3} />
    : <TextInput id={id} name={field.name} type={field.type || "text"} step={field.step} min={field.type === "number" ? 0 : undefined} required={field.required} defaultValue={defaultValue ?? (field.type === "date" ? new Date().toISOString().slice(0, 10) : "")} />}</div>;
}
function FinanceFields({ options, initialType }: { options: Props["options"]; initialType?: string }) {
  const [type, setType] = useState(initialType === "PEMASUKAN" || initialType === "PENGELUARAN" ? initialType : "");
  const [category, setCategory] = useState("");
  const categories = (options.kategori_keuangan || []).filter(item => item.type === type);
  return <>
    <div className="space-y-2"><Label htmlFor="finance-type">Tipe transaksi</Label><Select name="tipe" required value={type} onValueChange={value => { setType(value); setCategory(""); }}><SelectTrigger id="finance-type" className="h-9 w-full bg-card"><SelectValue placeholder="Pilih tipe transaksi" /></SelectTrigger><SelectContent><SelectItem value="PEMASUKAN">Pemasukan</SelectItem><SelectItem value="PENGELUARAN">Pengeluaran</SelectItem></SelectContent></Select></div>
    <div className="space-y-2"><Label htmlFor="finance-category">Kategori sesuai tipe</Label><Select name="id_kategori_keuangan" required value={category} onValueChange={setCategory} disabled={!type || !categories.length}><SelectTrigger id="finance-category" className="h-9 w-full bg-card"><SelectValue placeholder={!type ? "Pilih tipe terlebih dahulu" : categories.length ? "Pilih kategori" : `Belum ada kategori ${type.toLowerCase()}`} /></SelectTrigger><SelectContent>{categories.map(item => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select>{type && !categories.length && <p className="text-xs text-muted-foreground">Belum ada kategori {type.toLowerCase()}. <Link href="/keuangan/kategori" className="font-semibold text-primary underline underline-offset-2">Kelola kategori</Link></p>}</div>
  </>;
}
function RecordActions({ path, config, row, canWrite, role, onEdit }: { path: string; config: Section; row: Record<string, unknown>; canWrite: boolean; role: Role; onEdit: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const master = Boolean(config.master && canWrite);
  const detail = path === "peternakan/populasi";
  const cancellable = role === "Administrator" && ["pakan/masuk", "pakan/mix", "pakan/keluar", "telur/panen", "telur/distribusi", "keuangan/transaksi"].includes(path);
  if (!master && !detail && !cancellable) return null;
  const action = master ? saveSection.bind(null, path) : cancelSection.bind(null, path, String(row[config.id]));
  return <><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={`Aksi ${String(row[config.id])}`}><Ellipsis className="size-4" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-36">
      {detail && <DropdownMenuItem asChild><Link href={`/peternakan/populasi/${row.id_populasi}`}>Detail</Link></DropdownMenuItem>}
      {master && <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>}
      {(master || cancellable) && <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>{master ? "Hapus" : "Batalkan"}</DropdownMenuItem>}
    </DropdownMenuContent></DropdownMenu>
    {(master || cancellable) && <ConfirmDeleteDialog action={action} id={String(row[config.id])} label={master ? "Hapus" : "Batalkan"} title={master ? "Hapus data ini?" : "Batalkan transaksi ini?"} controlledOpen={confirmOpen} onControlledOpenChange={setConfirmOpen} />}
  </>;
}
export function SectionView({ path, config, rows, details: loadedDetails, options, role, search, loadError, filterKey, filterOptions }: Props) {
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [details, setDetails] = useState<DetailItem[]>([blankDetail()]);
  const formRef = useRef<HTMLDivElement>(null);
  const canWrite = role === "Administrator" || (role === "ABK" && !config.master && !config.adminOnly && !config.finance);
  const detailKind = path === "pakan/mix" ? "mix" : path === "telur/sortir" ? "sortir" : path === "telur/distribusi" ? "distribusi" : null;
  const detailOptions = detailKind === "mix" ? options.pakan : options.kategori_telur;
  const formAction = saveSection.bind(null, path);
  const parent = path.startsWith("peternakan") ? { label: "Peternakan", href: "/peternakan/kandang" } : path.startsWith("pakan") ? { label: "Pakan", href: "/pakan/master" } : path.startsWith("telur") ? { label: "Produksi telur", href: "/telur/panen" } : { label: "Keuangan", href: "/keuangan/transaksi" };
  const formatCell = (column: string, value: unknown) => {
    const raw = String(value ?? "");
    const source = column === "id_pakan_hasil" ? "pakan" : column.replace(/^id_/, "");
    const relation = options[source]?.find(item => item.id === raw)?.label;
    if (relation) return relation;
    if (!raw) return "—";
    if (status(raw)) return <StatusBadge value={raw} />;
    if (/^tanggal/.test(column)) return formatDate(raw);
    if (currency(column) && !Number.isNaN(Number(value))) return formatMoney(Number(value));
    if (numeric(column) && !Number.isNaN(Number(value))) return formatNumber(Number(value), /berat|stok/.test(column));
    return raw;
  };
  const showActions = Boolean((config.master && canWrite) || path === "peternakan/populasi" || (role === "Administrator" && ["pakan/masuk", "pakan/mix", "pakan/keluar", "telur/panen", "telur/distribusi", "keuangan/transaksi"].includes(path)));
  return <div className="space-y-6">
    <FeedbackToast success={search.success} error={search.error} />
    <PageHeader title={config.title} parent={parent} description={`Kelola data ${config.title.toLowerCase()} untuk operasional peternakan.`} action={canWrite && config.fields.length > 0 ? <Button type="button" onClick={() => { setEditing(null); formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><Plus className="size-4" />Tambah {config.title}</Button> : undefined} />
    {loadError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Data gagal dimuat. Periksa koneksi dan migration.</p>}
    {canWrite && config.fields.length > 0 && <div ref={formRef} className="scroll-mt-24"><Card><CardHeader><CardTitle>{editing ? "Ubah data" : `Tambah ${config.title.toLowerCase()}`}</CardTitle><CardDescription>Isi informasi yang diperlukan, lalu simpan.</CardDescription></CardHeader><CardContent><form action={formAction} className="space-y-5">
      <input type="hidden" name="_operation" value={editing ? "edit" : "create"} /><input type="hidden" name="_id" value={editing ? String(editing[config.id]) : ""} />
      <div className="grid gap-4 sm:grid-cols-2">{path === "keuangan/transaksi" && <FinanceFields options={options} initialType={search.type} />}{config.fields.filter(field => path !== "keuangan/transaksi" || (field.name !== "tipe" && field.name !== "id_kategori_keuangan")).map(field => <FieldInput key={`${field.name}-${String(editing?.[config.id] || "new")}`} field={field} options={options} defaultValue={editing ? String(editing[field.name] ?? "") : undefined} />)}</div>
      {detailKind && <div className="space-y-4"><Separator /><div><h3 className="font-semibold">{detailKind === "mix" ? "Bahan campuran" : detailKind === "sortir" ? "Hasil sortir" : "Rincian distribusi"}</h3><p className="text-sm text-muted-foreground">Tambahkan setiap item beserta jumlahnya.</p></div>
        <div className="space-y-3">{details.map((item, index) => <div key={index} className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="grid gap-1"><Label htmlFor={`detail-item-${index}`} className="text-xs">Item</Label><Select name={`_detail_item_${index}`} required value={detailKind === "mix" ? item.id_pakan : item.id_kategori_telur} onValueChange={value => setDetails(old => old.map((row, i) => i === index ? { ...row, [detailKind === "mix" ? "id_pakan" : "id_kategori_telur"]: value } : row))}><SelectTrigger id={`detail-item-${index}`} className="h-9 w-full min-w-0 bg-card"><SelectValue placeholder={`Pilih ${detailKind === "mix" ? "pakan" : "kategori telur"}`} /></SelectTrigger><SelectContent>{(detailOptions || []).map(option => <SelectItem value={option.id} key={option.id}>{option.label}</SelectItem>)}</SelectContent></Select></div>
          <label className="grid gap-1 text-xs font-medium">{detailKind === "mix" ? "Berat (kg)" : "Jumlah (butir)"}<TextInput required type="number" min="0.001" step={detailKind === "mix" ? "0.001" : "1"} value={detailKind === "mix" ? item.berat_bahan : item.jumlah_telur} onChange={event => setDetails(old => old.map((row, i) => i === index ? { ...row, [detailKind === "mix" ? "berat_bahan" : "jumlah_telur"]: event.target.value } : row))} /></label>
          {detailKind === "distribusi" && <label className="grid gap-1 text-xs font-medium sm:col-span-2">Harga satuan<TextInput required type="number" min="0" step="0.01" value={item.harga_satuan} onChange={event => setDetails(old => old.map((row, i) => i === index ? { ...row, harga_satuan: event.target.value } : row))} /></label>}
          {details.length > 1 && <Button type="button" size="icon" variant="ghost" aria-label="Hapus detail" onClick={() => setDetails(old => old.filter((_, i) => i !== index))}><Trash2 className="size-4" /></Button>}
        </div>)}</div>
        <Button type="button" variant="outline" onClick={() => setDetails(old => [...old, blankDetail()])}><Plus className="size-4" />Tambah item</Button>
        <div className="rounded-lg bg-secondary px-4 py-3 text-sm"><span className="text-muted-foreground">Total {detailKind === "mix" ? "berat" : "telur"}</span><strong className="float-right tabular-nums">{formatNumber(details.reduce((sum, item) => sum + Number(detailKind === "mix" ? item.berat_bahan : item.jumlah_telur || 0), 0), detailKind === "mix")} {detailKind === "mix" ? "kg" : "butir"}</strong></div>
        <input type="hidden" name="_details" value={JSON.stringify(details.map(item => detailKind === "mix" ? { id_pakan: item.id_pakan, berat_bahan: Number(item.berat_bahan) } : detailKind === "sortir" ? { id_kategori_telur: item.id_kategori_telur, jumlah_telur: Number(item.jumlah_telur) } : { id_kategori_telur: item.id_kategori_telur, jumlah_telur: Number(item.jumlah_telur), harga_satuan: Number(item.harga_satuan) }))} />
      </div>}
      <div className="flex justify-end gap-2 border-t pt-4">{editing && <Button type="button" variant="outline" onClick={() => setEditing(null)}>Batal</Button>}<Submit label={editing ? "Simpan perubahan" : "Simpan"} /></div>
    </form></CardContent></Card></div>}
    <Card><CardHeader><CardTitle>Daftar {config.title.toLowerCase()}</CardTitle><CardDescription>{rows.length} data ditampilkan.</CardDescription></CardHeader><CardContent className="space-y-4">
      <form className="flex flex-wrap items-end gap-2"><label className="relative min-w-[180px] flex-1"><span className="sr-only">Cari data</span><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><TextInput name="q" defaultValue={search.q} placeholder="Cari data..." className="pl-9" /></label>
        {config.columns.some(column => column === "tanggal" || column === "tanggal_masuk") && <><label className="grid gap-1 text-xs text-muted-foreground">Dari<TextInput name="from" type="date" defaultValue={search.from} /></label><label className="grid gap-1 text-xs text-muted-foreground">Sampai<TextInput name="to" type="date" defaultValue={search.to} /></label></>}
        {filterKey && filterOptions.length > 0 && <select name="filter" defaultValue={search.filter || ""} aria-label={`Filter ${readable(filterKey)}`} className="h-9 rounded-lg border bg-card px-3 text-sm"><option value="">Semua {readable(filterKey)}</option>{filterOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select>}
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      {rows.length ? <div className="overflow-x-auto rounded-lg border"><Table className="min-w-[620px]"><TableHeader><TableRow>{config.columns.map(column => <TableHead key={column} className={numeric(column) ? "text-right" : ""}>{readable(column)}</TableHead>)}{showActions && <TableHead className="w-12 text-right">Aksi</TableHead>}</TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={String(row[config.id])}>{config.columns.map(column => <TableCell key={column} className={numeric(column) ? "text-right tabular-nums" : "max-w-56 truncate"}>{formatCell(column, row[column])}</TableCell>)}{showActions && <TableCell className="text-right"><RecordActions path={path} config={config} row={row} canWrite={canWrite} role={role} onEdit={() => { setEditing(row); formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} /></TableCell>}</TableRow>)}</TableBody></Table></div> : <EmptyState icon={Search} title="Belum ada data" description={role === "Pemilik" ? "Belum ada data pada daftar ini." : "Tambahkan data atau ubah filter untuk menampilkan hasil."} />}
    </CardContent></Card>
    {loadedDetails.length > 0 && <Card><CardHeader><CardTitle>Rincian transaksi</CardTitle></CardHeader><CardContent className="space-y-2">{rows.map(row => {
      const parentKey = path === "pakan/mix" ? "id_mix" : path === "telur/distribusi" ? "id_distribusi" : "id_panen";
      const matching = loadedDetails.filter(item => item[parentKey] === row[config.id]);
      return matching.length > 0 && <details key={String(row[config.id])} className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer font-medium">{String(row[config.columns[0]] || row[config.id])} · {matching.length} detail</summary><ul className="mt-3 space-y-2 text-muted-foreground">{matching.map(item => <li key={String(item.no_detail)} className="border-t pt-2">#{String(item.no_detail)} · {path === "pakan/mix" ? `${options.pakan?.find(option => option.id === item.id_pakan_bahan)?.label || item.id_pakan_bahan}: ${formatNumber(Number(item.berat_bahan), true)} kg · ${formatMoney(Number(item.biaya_bahan))}` : `${options.kategori_telur?.find(option => option.id === item.id_kategori_telur)?.label || item.id_kategori_telur}: ${formatNumber(Number(item.jumlah_telur))} butir${path === "telur/distribusi" ? ` · ${formatMoney(Number(item.subtotal))}` : ""}`}</li>)}</ul></details>;
    })}</CardContent></Card>}
  </div>;
}
