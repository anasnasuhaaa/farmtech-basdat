"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyMetric } from "@/lib/business/metrics";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

function ChartCard({ title, description, children, empty }: { title: string; description: string; children: React.ReactNode; empty?: boolean }) {
  return <Card className="min-w-0"><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent>{empty ? <EmptyState icon={BarChart3} title="Belum ada data pada periode ini" description="Grafik akan muncul ketika transaksi terkait sudah dicatat." /> : <div className="h-[230px] w-full sm:h-[280px]">{children}</div>}</CardContent></Card>;
}
const tick = { fontSize: 11, fill: "var(--muted-foreground)" };
const axis = (value: string) => formatDate(value).slice(0, 5);
export function DashboardCharts({ days, showFinance }: { days: DailyMetric[]; showFinance: boolean }) {
  const production = days.some(day => day.eggs > 0);
  const feed = days.some(day => day.feedKg > 0);
  const finance = days.some(day => day.income > 0 || day.expense > 0);
  const rates = days.some(day => day.hdp !== null || day.hhp !== null);
  const fcr = days.some(day => day.fcr !== null);
  return <div className="grid min-w-0 gap-4 lg:grid-cols-2">
    <ChartCard title="Tren produksi telur" description="Jumlah telur per hari dalam periode terpilih." empty={!production}>
      <ResponsiveContainer width="100%" height="100%"><AreaChart data={days} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}><defs><linearGradient id="eggFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-production)" stopOpacity={0.26} /><stop offset="100%" stopColor="var(--chart-production)" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={axis} tick={tick} axisLine={false} tickLine={false} minTickGap={22} /><YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip labelFormatter={value => formatDate(String(value))} formatter={value => [`${formatNumber(Number(value))} butir`, "Panen"]} /><Area dataKey="eggs" name="Panen" type="monotone" stroke="var(--chart-production)" strokeWidth={2.5} fill="url(#eggFill)" /></AreaChart></ResponsiveContainer>
    </ChartCard>
    <ChartCard title="Penggunaan pakan" description="Pakan keluar per hari, dalam kilogram." empty={!feed}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={days} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={axis} tick={tick} axisLine={false} tickLine={false} minTickGap={22} /><YAxis tick={tick} axisLine={false} tickLine={false} /><Tooltip labelFormatter={value => formatDate(String(value))} formatter={value => [`${formatNumber(Number(value))} kg`, "Pakan keluar"]} /><Bar dataKey="feedKg" name="Pakan keluar" fill="var(--chart-feed)" radius={[4, 4, 0, 0]} maxBarSize={28} /></BarChart></ResponsiveContainer>
    </ChartCard>
    {showFinance && <ChartCard title="Pemasukan vs pengeluaran" description="Transaksi keuangan per hari." empty={!finance}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={days} margin={{ top: 10, right: 10, left: -14, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={axis} tick={tick} axisLine={false} tickLine={false} minTickGap={22} /><YAxis tick={tick} axisLine={false} tickLine={false} tickFormatter={value => Number(value) >= 1000000 ? `${Number(value) / 1000000} jt` : Number(value) >= 1000 ? `${Number(value) / 1000} rb` : String(value)} /><Tooltip labelFormatter={value => formatDate(String(value))} formatter={(value, name) => [formatMoney(Number(value)), String(name)]} /><Legend /><Bar dataKey="income" name="Pemasukan" fill="var(--chart-income)" radius={[4, 4, 0, 0]} maxBarSize={22} /><Bar dataKey="expense" name="Pengeluaran" fill="var(--chart-expense)" radius={[4, 4, 0, 0]} maxBarSize={22} /></BarChart></ResponsiveContainer>
    </ChartCard>}
    <ChartCard title="HDP dan HHP" description="Persentase produksi terhadap populasi aktif dan awal." empty={!rates}>
      <ResponsiveContainer width="100%" height="100%"><LineChart data={days} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={axis} tick={tick} axisLine={false} tickLine={false} minTickGap={22} /><YAxis tick={tick} axisLine={false} tickLine={false} unit="%" /><Tooltip labelFormatter={value => formatDate(String(value))} formatter={(value, name) => [`${formatNumber(Number(value))}%`, String(name)]} /><Legend /><Line dataKey="hdp" name="HDP" type="monotone" stroke="var(--chart-production)" strokeWidth={2.5} dot={false} connectNulls={false} /><Line dataKey="hhp" name="HHP" type="monotone" stroke="var(--chart-4)" strokeWidth={2.5} dot={false} connectNulls={false} /></LineChart></ResponsiveContainer>
    </ChartCard>
    <ChartCard title="FCR" description="Rasio pakan terhadap berat telur utuh; sumbu terpisah dari persentase." empty={!fcr}>
      <ResponsiveContainer width="100%" height="100%"><LineChart data={days} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={axis} tick={tick} axisLine={false} tickLine={false} minTickGap={22} /><YAxis tick={tick} axisLine={false} tickLine={false} /><Tooltip labelFormatter={value => formatDate(String(value))} formatter={value => [formatNumber(Number(value)), "FCR"]} /><Line dataKey="fcr" name="FCR" type="monotone" stroke="var(--chart-feed)" strokeWidth={2.5} dot={false} connectNulls={false} /></LineChart></ResponsiveContainer>
    </ChartCard>
  </div>;
}
