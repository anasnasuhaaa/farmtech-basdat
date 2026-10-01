import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { sections, optionId, optionLabel } from "@/lib/sections";
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
  const filterKey = config.columns.find(x => ["id_kandang","id_kategori_ternak","id_pakan","id_pakan_hasil","id_kategori_telur","id_kategori_keuangan","jenis_pakan","tipe"].includes(x));
  const dateColumn = config.columns.includes("tanggal") ? "tanggal" : config.columns.includes("tanggal_masuk") ? "tanggal_masuk" : null;
  const detailTable = path === "pakan/mix" ? "detail_mix_pakan" : path === "telur/panen" || path === "telur/sortir" ? "detail_sortir" : path === "telur/distribusi" ? "detail_distribusi" : null;
  const data: Record<string, unknown>[] = [];
  const details: Record<string, unknown>[] = [];
  let error = false;
  try {
    for (let offset = 0; ; offset += 1000) {
      let query = supabase.from(config.table).select("*");
      if (dateColumn && /^\d{4}-\d{2}-\d{2}$/.test(search.from || "")) query = query.gte(dateColumn, search.from!);
      if (dateColumn && /^\d{4}-\d{2}-\d{2}$/.test(search.to || "")) query = query.lte(dateColumn, search.to!);
      if (filterKey && search.filter) query = query.eq(filterKey, search.filter);
      const result = await query.order(config.id).range(offset, offset + 999);
      if (result.error) throw new Error("Data gagal dimuat");
      data.push(...(result.data || []));
      if (!result.data || result.data.length < 1000) break;
    }
  } catch { error = true; }
  const filterSource = filterKey?.startsWith("id_") ? (filterKey === "id_pakan_hasil" ? "pakan" : filterKey.slice(3)) : null;
  const sources = [...new Set([...config.fields.map(x => x.source).filter((x): x is string => !!x),
    ...(path === "telur/panen" || path === "telur/sortir" || path === "telur/distribusi" ? ["kategori_telur"] : []),
    ...(filterSource ? [filterSource] : [])])];
  const options: Record<string, { id: string; label: string; type?: string }[]> = {};
  await Promise.all(sources.map(async source => {
    const result = await supabase.from(source).select("*").limit(200);
    options[source] = (result.data || []).map(row => ({ id: String(row[optionId[source]]), label: String(row[optionLabel[source]]), ...(source === "kategori_keuangan" ? { type: String(row.tipe) } : {}) }));
  }));
  const rows = data.filter(row => (!search.from || !dateColumn || String(row[dateColumn]) >= search.from)
    && (!search.to || !dateColumn || String(row[dateColumn]) <= search.to)
    && (!search.filter || !filterKey || String(row[filterKey]) === search.filter)
    && (!search.q || Object.values(row).some(value => String(value ?? "").toLowerCase().includes(search.q!.toLowerCase()))));
  if (detailTable && rows.length) {
    const parentKey = path === "pakan/mix" ? "id_mix" : path === "telur/distribusi" ? "id_distribusi" : "id_panen";
    try {
      for (let index = 0; index < rows.length; index += 100) {
        const ids = rows.slice(index, index + 100).map(row => String(row[config.id]));
        for (let offset = 0; ; offset += 1000) {
          const result = await supabase.from(detailTable).select("*").in(parentKey, ids).order(parentKey).order("no_detail").range(offset, offset + 999);
          if (result.error) throw new Error("Rincian gagal dimuat");
          details.push(...(result.data || []));
          if (!result.data || result.data.length < 1000) break;
        }
      }
    } catch { error = true; }
  }
  const filterOptions = filterSource ? options[filterSource] || [] : filterKey ? (config.fields.find(x => x.name === filterKey)?.options || []).map(x => ({ id: x, label: x })) : [];
  return <SectionView path={path} config={config} rows={rows} details={details} options={options} role={role} search={search} loadError={error} filterKey={filterKey} filterOptions={filterOptions} />;
}
