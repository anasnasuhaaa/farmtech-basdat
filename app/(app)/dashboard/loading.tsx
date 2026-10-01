import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
export default function DashboardLoading() {
  return <div className="space-y-6"><Skeleton className="h-16 w-64" /><Skeleton className="h-10 w-full max-w-lg" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 7 }, (_, index) => <Card key={index}><CardContent className="space-y-6"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-32" /></CardContent></Card>)}</div><div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Card key={index}><CardContent className="space-y-4"><Skeleton className="h-5 w-40" /><Skeleton className="h-64 w-full" /></CardContent></Card>)}</div></div>;
}
