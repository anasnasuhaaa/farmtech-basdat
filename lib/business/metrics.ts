export type Row = Record<string, unknown>;
export type DailyMetric = {
  date: string; population: number; initial: number; eggs: number; feedKg: number;
  wholeWeightKg: number; income: number; expense: number;
  layerPopulation: number; layerInitial: number; partial: boolean; populationInconsistent: boolean;
  hdp: number | null; hhp: number | null; fcr: number | null;
};

export function jakartaToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find(part => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function dateRange(params: { period?: string; from?: string; to?: string }, today = jakartaToday(), maxDays = 90) {
  if (params.period === "custom" && (!validDate(params.from) || !validDate(params.to))) {
    return { from: shiftDate(today, -29), to: today, period: "30", invalid: true };
  }
  const end = params.period === "custom" && validDate(params.to) ? params.to! : today;
  const start = params.period === "custom" && validDate(params.from) ? params.from! : shiftDate(end, params.period === "7" ? -6 : -29);
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  if (days < 1 || days > maxDays || end > today) return { from: shiftDate(today, -29), to: today, period: "30", invalid: true };
  return { from: start, to: end, period: params.period === "custom" ? "custom" : params.period === "7" ? "7" : "30", invalid: false };
}

function validDate(value?: string) {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function shiftDate(day: string, days: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
const number = (value: unknown) => Number(value || 0);

// Daily demo proxies. Only explicitly identified layer categories and their exclusive cages
// may contribute to production rates. Feed issued and intact-egg mass are not consumption
// and total egg mass; see docs/METRIC_AUDIT.md.
export function dailyMetrics(from: string, to: string, populations: Row[], mutations: Row[], harvests: Row[], feedIssues: Row[], finance: Row[], layerCategoryIds?: Set<string>): DailyMetric[] {
  const result: DailyMetric[] = [];
  for (let day = from; day <= to; day = shiftDate(day, 1)) {
    const relevant = populations.filter(p => String(p.tanggal_masuk) <= day);
    const initial = relevant.reduce((sum, p) => sum + number(p.jumlah_awal), 0);
    const activeByCohort = relevant.map(p => ({ row: p, active: number(p.jumlah_awal) - mutations.filter(m => m.id_populasi === p.id_populasi && String(m.tanggal) <= day && m.jenis_mutasi !== "PEMINDAHAN").reduce((sum, m) => sum + number(m.jumlah), 0) }));
    const populationInconsistent = activeByCohort.some(p => p.active < 0);
    const population = activeByCohort.reduce((sum, p) => sum + p.active, 0);
    const layers = activeByCohort.filter(p => !layerCategoryIds || layerCategoryIds.has(String(p.row.id_kategori_ternak)));
    const layerInitial = layers.reduce((sum, p) => sum + number(p.row.jumlah_awal), 0);
    const layerPopulation = layers.reduce((sum, p) => sum + p.active, 0);
    const layerCages = new Set(layers.map(p => String(p.row.id_kandang)));
    for (const p of activeByCohort.filter(p => !layers.includes(p))) layerCages.delete(String(p.row.id_kandang));
    const harvestToday = harvests.filter(x => x.tanggal === day);
    const harvest = layerCategoryIds ? harvestToday.filter(x => layerCages.has(String(x.id_kandang))) : harvestToday;
    const eggs = harvest.reduce((sum, x) => sum + number(x.jumlah_utuh) + number(x.jumlah_retak), 0);
    const wholeWeightKg = harvest.reduce((sum, x) => sum + number(x.berat_utuh_kg), 0);
    const issuesToday = feedIssues.filter(x => x.tanggal === day);
    const issues = layerCategoryIds ? issuesToday.filter(x => layerCages.has(String(x.id_kandang))) : issuesToday;
    const feedKg = issues.reduce((sum, x) => sum + number(x.jumlah_kg), 0);
    const partial = Boolean(layerCategoryIds && (harvest.length !== harvestToday.length || issues.length !== issuesToday.length || relevant.length !== layers.length)) || harvest.some(x => number(x.jumlah_retak) > 0);
    const transactions = finance.filter(x => x.tanggal === day);
    const income = transactions.filter(x => x.tipe === "PEMASUKAN").reduce((sum, x) => sum + number(x.nominal), 0);
    const expense = transactions.filter(x => x.tipe === "PENGELUARAN").reduce((sum, x) => sum + number(x.nominal), 0);
    result.push({ date: day, population, initial, layerPopulation, layerInitial, populationInconsistent, partial, eggs, feedKg, wholeWeightKg, income, expense,
      hdp: !populationInconsistent && layerPopulation > 0 ? eggs / layerPopulation * 100 : null,
      hhp: !populationInconsistent && layerInitial > 0 ? eggs / layerInitial * 100 : null,
      fcr: wholeWeightKg > 0 ? feedKg / wholeWeightKg : null });
  }
  return result;
}
