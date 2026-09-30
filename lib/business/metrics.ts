export type Row = Record<string, unknown>;
export type DailyMetric = {
  date: string; population: number; initial: number; eggs: number; feedKg: number;
  wholeWeightKg: number; income: number; expense: number;
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

// DEMO BUSINESS FORMULA: HDP=eggs/active birds, HHP=eggs/initial birds, FCR=feed kg/whole egg kg.
// Bird counts use the population and mutations dated on or before each day.
export function dailyMetrics(from: string, to: string, populations: Row[], mutations: Row[], harvests: Row[], feedIssues: Row[], finance: Row[]): DailyMetric[] {
  const result: DailyMetric[] = [];
  for (let day = from; day <= to; day = shiftDate(day, 1)) {
    const relevant = populations.filter(p => String(p.tanggal_masuk) <= day);
    const initial = relevant.reduce((sum, p) => sum + number(p.jumlah_awal), 0);
    const decrease = mutations.filter(m => String(m.tanggal) <= day && m.jenis_mutasi !== "PEMINDAHAN")
      .reduce((sum, m) => sum + number(m.jumlah), 0);
    const population = Math.max(0, initial - decrease);
    const harvest = harvests.filter(x => x.tanggal === day);
    const eggs = harvest.reduce((sum, x) => sum + number(x.jumlah_utuh) + number(x.jumlah_retak), 0);
    const wholeWeightKg = harvest.reduce((sum, x) => sum + number(x.berat_utuh_kg), 0);
    const feedKg = feedIssues.filter(x => x.tanggal === day).reduce((sum, x) => sum + number(x.jumlah_kg), 0);
    const transactions = finance.filter(x => x.tanggal === day);
    const income = transactions.filter(x => x.tipe === "PEMASUKAN").reduce((sum, x) => sum + number(x.nominal), 0);
    const expense = transactions.filter(x => x.tipe === "PENGELUARAN").reduce((sum, x) => sum + number(x.nominal), 0);
    result.push({ date: day, population, initial, eggs, feedKg, wholeWeightKg, income, expense,
      hdp: population ? eggs / population * 100 : null,
      hhp: initial ? eggs / initial * 100 : null,
      fcr: wholeWeightKg ? feedKg / wholeWeightKg : null });
  }
  return result;
}
