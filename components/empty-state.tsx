import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return <Card><CardContent className="flex flex-col items-center px-4 py-10 text-center">
    <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-accent text-primary"><Icon className="size-6" /></span>
    <h3 className="font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </CardContent></Card>;
}
