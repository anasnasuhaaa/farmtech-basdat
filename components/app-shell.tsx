import Link from "next/link";
import type { Role } from "@/lib/auth";
import { logout } from "@/app/login/actions";

const links = [
  ["Dashboard","/dashboard","Dashboard"], ["Kandang","/peternakan/kandang","Peternakan"],
  ["Kategori ternak","/peternakan/kategori-ternak","Peternakan"], ["Populasi","/peternakan/populasi","Peternakan"],
  ["Master pakan","/pakan/master","Pakan"], ["Pakan masuk","/pakan/masuk","Pakan"],
  ["Mix pakan","/pakan/mix","Pakan"], ["Pakan keluar","/pakan/keluar","Pakan"], ["Stok pakan","/pakan/stok","Pakan"],
  ["Panen","/telur/panen","Telur"], ["Kategori telur","/telur/kategori","Telur"],
  ["Sortir","/telur/sortir","Telur"], ["Distribusi","/telur/distribusi","Telur"], ["Stok telur","/telur/stok","Telur"],
  ["Transaksi keuangan","/keuangan/transaksi","Keuangan"], ["Kategori keuangan","/keuangan/kategori","Keuangan"],
  ["Laporan","/keuangan/laporan","Keuangan"], ["Pengguna","/pengguna","Pengguna"],
] as const;
export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const nav = links.filter(x => (x[2] !== "Keuangan" || role !== "ABK") && (x[2] !== "Pengguna" || role === "Administrator"));
  return <div className="min-h-screen md:flex">
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar p-4 md:block">
      <Link href="/dashboard" className="text-xl font-semibold">Farm Tech</Link><p className="mb-6 text-xs text-muted-foreground">{role}</p>
      <nav className="space-y-1">{nav.map(x => <Link key={x[1]} href={x[1]} className="block rounded-md px-3 py-2 text-sm hover:bg-muted">{x[0]}</Link>)}</nav>
      <form action={logout} className="mt-6"><button className="text-sm underline">Logout</button></form>
    </aside>
    <div className="min-w-0 flex-1"><header className="border-b p-4 md:hidden"><Link href="/dashboard" className="font-semibold">Farm Tech</Link><span className="ml-3 text-xs text-muted-foreground">{role}</span></header>
      <main className="mx-auto max-w-7xl p-4 pb-24 md:p-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t bg-background md:hidden" aria-label="Navigasi utama">
        {["Dashboard","Peternakan","Pakan","Telur","Lainnya"].map(section => <Link key={section} href={section === "Lainnya" ? "/lainnya" : nav.find(x => x[2] === section)?.[1] || "/dashboard"} className="p-3 text-center text-xs">{section}</Link>)}
      </nav>
    </div>
  </div>;
}
