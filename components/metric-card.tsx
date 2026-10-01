import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ label, value, icon: Icon, detail, tone = "green" }: { label: string; value: string; icon: LucideIcon; detail?: string; tone?: "green" | "amber" | "earth" }) {
  const toneClass = tone === "amber" ? "bg-[color-mix(in_srgb,var(--chart-2)_18%,transparent)] text-foreground" : tone === "earth" ? "bg-[color-mix(in_srgb,var(--chart-3)_18%,transparent)] text-foreground" : "bg-secondary text-primary";
  return <Card className="min-w-0"><CardContent className="flex min-h-32 flex-col justify-between">
    <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-muted-foreground">{label}</p><span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${toneClass}`}><Icon className="size-5" /></span></div>
    <div><strong className="block truncate text-2xl font-semibold tracking-tight tabular-nums sm:text-[28px]">{value}</strong>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>
  </CardContent></Card>;
}
