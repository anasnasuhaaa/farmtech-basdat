import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
export default function SectionLoading() {
  return <div className="space-y-6"><Skeleton className="h-16 w-64" /><Card><CardContent className="space-y-4"><Skeleton className="h-5 w-48" /><div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-9 w-full" />)}</div></CardContent></Card><Card><CardContent className="space-y-3"><Skeleton className="h-9 w-full" />{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-11 w-full" />)}</CardContent></Card></div>;
}
