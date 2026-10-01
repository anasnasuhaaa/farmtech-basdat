import Link from "next/link";
import { FileChartColumn, LogOut, UserCog, WalletCards } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export default async function MorePage() {
  const { role } = await requireSession();
  const links = role === "ABK" ? [{ label: "Catat pemasukan lainnya", href: "/pemasukan", icon: WalletCards }] : [{ label: "Transaksi keuangan", href: "/keuangan/transaksi", icon: WalletCards }, { label: "Laporan keuangan", href: "/keuangan/laporan", icon: FileChartColumn }];
  if (role === "Administrator") links.push({ label: "Pengguna", href: "/pengguna", icon: UserCog });
  return <div className="max-w-2xl space-y-6"><PageHeader title="Lainnya" description={`Akses menu dan akun untuk role ${role}.`} /><Card><CardContent className="grid gap-1">{links.map(item => <Button key={item.href} asChild variant="ghost" className="h-12 justify-start gap-3"><Link href={item.href}><item.icon className="size-4" />{item.label}</Link></Button>)}<div className="mt-3 border-t pt-3"><form action={logout}><Button type="submit" variant="ghost" className="h-12 w-full justify-start gap-3"><LogOut className="size-4" />Keluar</Button></form></div></CardContent></Card></div>;
}
