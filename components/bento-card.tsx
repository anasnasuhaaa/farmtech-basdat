import { cn } from "@/lib/utils";

export function BentoCard({ children, className, featured = false }: { children: React.ReactNode; className?: string; featured?: boolean }) {
  return <section className={cn("min-w-0 rounded-[1.4rem] border border-border/80 bg-card p-5 shadow-[0_12px_34px_-28px_rgba(23,61,45,.5)] sm:p-6", featured && "border-primary/20 bg-primary text-primary-foreground", className)}>{children}</section>;
}
