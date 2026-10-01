"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Blend, Boxes, Egg, FileChartColumn, LayoutDashboard, Leaf, ListFilter, LogOut, Menu, Package, PackageCheck, PackageMinus, PackagePlus, Tags, Truck, UserCog, UsersRound, WalletCards, Warehouse } from "lucide-react";
import type { Role } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const groups = [
  { name: "Overview", items: [["Dashboard", "/dashboard", LayoutDashboard]] },
  { name: "Peternakan", items: [["Kandang", "/peternakan/kandang", Warehouse], ["Kategori ternak", "/peternakan/kategori-ternak", Tags], ["Populasi", "/peternakan/populasi", UsersRound]] },
  { name: "Pakan", items: [["Master pakan", "/pakan/master", Package], ["Pakan masuk", "/pakan/masuk", PackagePlus], ["Mix pakan", "/pakan/mix", Blend], ["Pakan keluar", "/pakan/keluar", PackageMinus], ["Stok pakan", "/pakan/stok", Boxes]] },
  { name: "Produksi telur", items: [["Panen", "/telur/panen", Egg], ["Kategori telur", "/telur/kategori", Tags], ["Sortir", "/telur/sortir", ListFilter], ["Distribusi", "/telur/distribusi", Truck], ["Stok telur", "/telur/stok", PackageCheck]] },
  { name: "Keuangan", items: [["Transaksi keuangan", "/keuangan/transaksi", WalletCards], ["Kategori keuangan", "/keuangan/kategori", Tags], ["Laporan", "/keuangan/laporan", FileChartColumn]] },
  { name: "Sistem", items: [["Pengguna", "/pengguna", UserCog]] },
] as const;

export function AppShell({ role, name, children }: { role: Role; name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const visible = groups.filter(group => group.name !== "Keuangan" || role !== "ABK").filter(group => group.name !== "Sistem" || role === "Administrator");
  const menu = role === "ABK" ? [...visible, { name: "Keuangan", items: [["Catat pemasukan", "/pemasukan", WalletCards]] as const }] : visible;
  return <SidebarProvider>
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4"><Link href="/dashboard" className="flex items-center gap-3 overflow-hidden px-2"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Leaf className="size-5" /></span><span className="min-w-0 group-data-[collapsible=icon]:hidden"><strong className="block text-sm tracking-tight">Farm Tech</strong><small className="block text-[11px] text-muted-foreground">Farm Management</small></span></Link></SidebarHeader>
      <SidebarContent>{menu.map(group => <SidebarGroup key={group.name}><SidebarGroupLabel>{group.name}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{group.items.map(([label, href, Icon]) => <SidebarMenuItem key={href}><SidebarMenuButton asChild isActive={pathname === href || (href === "/peternakan/populasi" && pathname.startsWith(href + "/"))} tooltip={label}><Link href={href}><Icon /><span>{label}</span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>)}</SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3"><p className="truncate px-2 text-sm font-medium group-data-[collapsible=icon]:hidden">{name}<span className="block text-xs font-normal text-muted-foreground">{role}</span></p><form action={logout}><Button variant="ghost" className="w-full justify-start"><LogOut className="size-4" /><span className="group-data-[collapsible=icon]:hidden">Keluar</span></Button></form></SidebarFooter>
    </Sidebar>
    <SidebarInset className="min-w-0 bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 text-sm">Lewati navigasi</a>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-7">
        <div className="hidden md:block"><SidebarTrigger aria-label="Tampilkan atau sembunyikan sidebar" /></div>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold md:hidden"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Leaf className="size-4" /></span>Farm Tech</Link>
        <span className="ml-auto hidden text-xs text-muted-foreground md:block">Farm Management</span>
        <Sheet><SheetTrigger asChild><Button type="button" variant="ghost" size="icon" className="ml-auto size-11 md:hidden" aria-label="Buka menu navigasi"><Menu className="size-5" /></Button></SheetTrigger>
          <SheetContent side="right" className="w-[min(86vw,340px)] max-w-none gap-0 pb-[env(safe-area-inset-bottom)] md:hidden"><SheetHeader className="border-b"><SheetTitle>Farm Tech</SheetTitle><SheetDescription>{name} · {role}</SheetDescription></SheetHeader>
            <nav aria-label="Navigasi utama" className="min-h-0 flex-1 overflow-y-auto px-3 py-3">{menu.map(group => <div key={group.name} className="mb-4"><p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.name}</p>{group.items.map(([label, href, Icon]) => <SheetClose asChild key={href}><Link href={href} aria-current={pathname === href ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm hover:bg-accent ${pathname === href ? "bg-accent font-semibold text-primary" : "text-foreground"}`}><Icon className="size-4 shrink-0" />{label}</Link></SheetClose>)}</div>)}</nav>
            <div className="border-t px-4 py-3"><p className="truncate text-sm font-medium">{name}</p><p className="text-xs text-muted-foreground">{role}</p><form action={logout}><Button variant="ghost" className="mt-2 w-full justify-start"><LogOut className="size-4" />Keluar</Button></form></div>
          </SheetContent></Sheet>
      </header>
      <div id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1480px] min-w-0 flex-1 px-4 py-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6 md:px-8 md:py-8 md:pb-10">{children}</div>
    </SidebarInset>
  </SidebarProvider>;
}
