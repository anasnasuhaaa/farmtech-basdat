import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export function PageHeader({ title, description, parent, action }: { title: string; description?: string; parent?: { label: string; href: string }; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0 space-y-2">
      {parent && <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink asChild><Link href={parent.href}>{parent.label}</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{title}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>}
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[30px]">{title}</h1>
      {description && <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>}
    </div>
    {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
  </div>;
}
