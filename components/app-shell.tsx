"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Blend, Boxes, ChevronDown, Egg, FileChartColumn, LayoutDashboard, Leaf, ListFilter, LogOut, Menu, Package, PackageCheck, PackageMinus, PackagePlus, Tags, Truck, UserCog, UsersRound, WalletCards, Warehouse } from "lucide-react";
import type { Role } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
const mobileGroups = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, match: "/dashboard" },
  { label: "Peternakan", href: "/peternakan/kandang", icon: Warehouse, match: "/peternakan" },
  { label: "Pakan", href: "/pakan/master", icon: Package, match: "/pakan" },
  { label: "Telur", href: "/telur/panen", icon: Egg, match: "/telur" },
] as const;

export function AppShell({ role, name, children }: { role: Role; name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const visible = groups.filter(group => group.name !== "Keuangan" || role !== "ABK").filter(group => group.name !== "Sistem" || role === "Administrator");
  const moreActive = pathname.startsWith("/keuangan") || pathname === "/pengguna" || pathname === "/pemasukan" || pathname === "/lainnya";
  return <SidebarProvider>
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden px-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Leaf className="size-5" /></span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden"><strong className="block text-sm tracking-tight">Farm Tech</strong><small className="block text-[11px] text-muted-foreground">Farm Management</small></span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {visible.map(group => <SidebarGroup key={group.name}>
          <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{group.items.map(([label, href, Icon]) => <SidebarMenuItem key={href}>
            <SidebarMenuButton asChild isActive={pathname === href || (href === "/peternakan/populasi" && pathname.startsWith(href + "/"))} tooltip={label}>
              <Link href={href}><Icon /><span>{label}</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>)}
        {role === "ABK" && <SidebarGroup><SidebarGroupLabel>Keuangan</SidebarGroupLabel><SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === "/pemasukan"} tooltip="Catat pemasukan"><Link href="/pemasukan"><WalletCards /><span>Catat pemasukan</span></Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroup>}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-auto w-full justify-start gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center" aria-label={`Akun ${name}`}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">{name.slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0 flex-1 truncate text-left group-data-[collapsible=icon]:hidden"><span className="block truncate text-sm">{name}</span><span className="block text-xs text-muted-foreground">{role}</span></span><ChevronDown className="size-4 group-data-[collapsible=icon]:hidden" />
        </Button></DropdownMenuTrigger><DropdownMenuContent align="end" side="top" className="w-48"><DropdownMenuItem asChild><form action={logout} className="w-full"><button className="flex w-full items-center gap-2"><LogOut className="size-4" /> Keluar</button></form></DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className="min-w-0 bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm">Lewati navigasi</a>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-7">
        <div className="hidden md:block"><SidebarTrigger aria-label="Tampilkan atau sembunyikan sidebar" /></div>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold md:hidden"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Leaf className="size-4" /></span>Farm Tech</Link>
        <span className="ml-auto hidden text-xs text-muted-foreground sm:block">Farm Management</span>
      </header>
      <div id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1480px] min-w-0 flex-1 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:px-8 md:py-8 md:pb-10">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-20px_rgba(24,61,42,.3)] backdrop-blur md:hidden" aria-label="Navigasi utama">
        {mobileGroups.map(item => <Link key={item.label} href={item.href} aria-current={pathname.startsWith(item.match) ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] ${pathname.startsWith(item.match) ? "text-primary font-semibold" : "text-muted-foreground"}`}><item.icon className="size-5" />{item.label}</Link>)}
        <Sheet><SheetTrigger asChild><button type="button" aria-current={moreActive ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] ${moreActive ? "text-primary font-semibold" : "text-muted-foreground"}`}><Menu className="size-5" />Lainnya</button></SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]"><SheetHeader><SheetTitle>Lainnya</SheetTitle><SheetDescription>{name} · {role}</SheetDescription></SheetHeader>
            <div className="grid gap-1 px-4 pb-4">{(role === "ABK" ? [["Catat pemasukan", "/pemasukan", WalletCards]] : [["Transaksi keuangan", "/keuangan/transaksi", WalletCards], ["Kategori keuangan", "/keuangan/kategori", Tags], ["Laporan", "/keuangan/laporan", FileChartColumn]]).map(([label, href, Icon]) => <SheetClose asChild key={String(href)}><Link href={String(href)} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-accent"><Icon className="size-4" />{String(label)}</Link></SheetClose>)}
              {role === "Administrator" && <SheetClose asChild><Link href="/pengguna" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-accent"><UserCog className="size-4" />Pengguna</Link></SheetClose>}
              <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">Akun · {name}</div><form action={logout}><Button variant="ghost" className="w-full justify-start gap-3"><LogOut />Keluar</Button></form>
            </div>
          </SheetContent></Sheet>
      </nav>
    </SidebarInset>
  </SidebarProvider>;
}
