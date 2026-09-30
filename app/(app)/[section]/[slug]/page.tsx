import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { sections, optionId, optionLabel } from "@/lib/sections";
import { SectionView } from "./section-view";

type Params = { section: string; slug: string };
export default async function SectionPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ q?: string; from?: string; to?: string; error?: string; success?: string }> }) {
  const { section, slug } = await params;
  const path = `${section}/${slug}`;
  const config = sections[path];
  if (!config) notFound();
  const { supabase, role } = await requireSession();
  if (config.adminOnly && role !== "Administrator") notFound();
  const search = await searchParams;
  let query = supabase.from(config.table).select("*").limit(100);
  if (search.from && (config.columns.includes("tanggal") || config.columns.includes("tanggal_masuk"))) query = query.gte(config.columns.includes("tanggal") ? "tanggal" : "tanggal_masuk", search.from);
  if (search.to && (config.columns.includes("tanggal") || config.columns.includes("tanggal_masuk"))) query = query.lte(config.columns.includes("tanggal") ? "tanggal" : "tanggal_masuk", search.to);
  const { data, error } = await query;
  const sources = [...new Set(config.fields.map(x => x.source).filter((x): x is string => !!x))];
  const options: Record<string, { id: string; label: string }[]> = {};
  await Promise.all(sources.map(async source => {
    const result = await supabase.from(source).select("*").limit(200);
    options[source] = (result.data || []).map(row => ({ id: String(row[optionId[source]]), label: String(row[optionLabel[source]]) }));
  }));
  return <SectionView path={path} config={config} rows={(data || []) as Record<string, unknown>[]} options={options} role={role} search={search} loadError={!!error} />;
}
