import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { sections, optionId, optionLabel } from "@/lib/sections";
import { loadAll } from "@/lib/supabase/load-all";
import { SectionView } from "./section-view";

type Params = { section: string; slug: string };
export default async function SectionPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ q?: string; from?: string; to?: string; filter?: string; error?: string; success?: string; type?: string }> }) {
  const { section, slug } = await params;
  const path = `${section}/${slug}`;
  const config = sections[path];
  if (!config) notFound();
  const { supabase, role } = await requireSession();
  if ((config.adminOnly && role !== "Administrator") || (config.finance && role === "ABK")) notFound();
  const search = await searchParams;
  let data: Record<string, unknown>[] = [];
  let details: Record<string, unknown>[] = [];
  let error = false;
  try {
    data = await loadAll(supabase, config.table);
    const detailTable = path === "pakan/mix" ? "detail_mix_pakan" : path === "telur/panen" || path === "telur/sortir" ? "detail_sortir" : path === "telur/distribusi" ? "detail_distribusi" : null;
    if (detailTable) details = await loadAll(supabase, detailTable);
  } catch { error = true; }
  const filterKey = config.columns.find(x => ["id_kandang","id_kategori_ternak","id_pakan","id_pakan_hasil","id_kategori_telur","id_kategori_keuangan","jenis_pakan","tipe"].includes(x));
  const filterSource = filterKey?.startsWith("id_") ? (filterKey === "id_pakan_hasil" ? "pakan" : filterKey.slice(3)) : null;
  const sources = [...new Set([...config.fields.map(x => x.source).filter((x): x is string => !!x),
    ...(path === "telur/panen" || path === "telur/sortir" || path === "telur/distribusi" ? ["kategori_telur"] : []),
    ...(filterSource ? [filterSource] : [])])];
  const options: Record<string, { id: string; label: string; type?: string }[]> = {};
  await Promise.all(sources.map(async source => {
    const result = await supabase.from(source).select("*").limit(200);
    options[source] = (result.data || []).map(row => ({ id: String(row[optionId[source]]), label: String(row[optionLabel[source]]), ...(source === "kategori_keuangan" ? { type: String(row.tipe) } : {}) }));
  }));
  const dateColumn = config.columns.includes("tanggal") ? "tanggal" : config.columns.includes("tanggal_masuk") ? "tanggal_masuk" : null;
  const rows = data.filter(row => (!search.from || !dateColumn || String(row[dateColumn]) >= search.from)
    && (!search.to || !dateColumn || String(row[dateColumn]) <= search.to)
    && (!search.filter || !filterKey || String(row[filterKey]) === search.filter)
    && (!search.q || Object.values(row).some(value => String(value ?? "").toLowerCase().includes(search.q!.toLowerCase()))));
  const filterOptions = filterSource ? options[filterSource] || [] : filterKey ? (config.fields.find(x => x.name === filterKey)?.options || []).map(x => ({ id: x, label: x })) : [];
  return <SectionView path={path} config={config} rows={rows} details={details} options={options} role={role} search={search} loadError={error} filterKey={filterKey} filterOptions={filterOptions} />;
}
