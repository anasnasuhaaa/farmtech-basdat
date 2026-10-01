"use client";
import { useState } from "react";
import { BarChart3, Egg, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { demoAccounts } from "@/lib/demo-accounts";
import { login } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LoginForm({ error }: { error?: string }) {
  const [active, setActive] = useState<string>(demoAccounts[0].role);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const account = demoAccounts.find(item => item.role === active) || demoAccounts[0];
  return <>
    <section className="relative flex min-h-[230px] flex-col justify-between overflow-hidden bg-[#183d2a] p-6 text-white sm:p-10 lg:min-h-screen lg:p-14">
      <div className="absolute -right-24 -top-24 size-80 rounded-full border border-white/10" aria-hidden="true" /><div className="absolute -bottom-40 right-4 size-[30rem] rounded-full border border-white/10" aria-hidden="true" />
      <div className="relative flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-white/15"><Leaf className="size-6" /></span><div><strong className="block text-lg">Farm Tech</strong><span className="text-xs text-white/70">Farm Management</span></div></div>
      <div className="relative max-w-lg py-6 lg:py-0"><div className="mb-5 hidden size-14 items-center justify-center rounded-2xl bg-white/10 lg:flex"><Sprout className="size-8 text-[#d8a33b]" /></div><h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">Operasional peternakan, lebih tertata.</h1><p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">Pantau populasi, pakan, produksi telur, dan keuangan dalam satu ruang kerja yang jelas.</p></div>
      <div className="relative hidden gap-5 text-xs text-white/70 lg:flex"><span className="flex items-center gap-2"><Egg className="size-4" />Produksi</span><span className="flex items-center gap-2"><BarChart3 className="size-4" />Laporan</span><span className="flex items-center gap-2"><ShieldCheck className="size-4" />Akses sesuai peran</span></div>
    </section>
    <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-14"><Card className="w-full max-w-md border border-border shadow-[0_20px_60px_-35px_rgba(24,61,42,.4)]">
      <CardHeader><CardTitle className="text-2xl font-semibold">Masuk ke Farm Tech</CardTitle><CardDescription>Gunakan akun Anda untuk melanjutkan.</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <form action={login} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="login-email">Email</Label><Input id="login-email" required type="email" name="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} placeholder="nama@peternakan.com" /></div>
          <div className="space-y-2"><Label htmlFor="login-password">Password</Label><Input id="login-password" required type="password" name="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></div>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <SubmitButton className="h-10 w-full rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Masuk</SubmitButton>
        </form>
        <div className="border-t pt-5"><p className="mb-3 text-sm font-semibold">Coba akun demo</p>
          <Tabs value={active} onValueChange={setActive}><TabsList className="grid h-auto w-full grid-cols-3">{demoAccounts.map(item => <TabsTrigger key={item.role} value={item.role} className="px-1 text-xs sm:text-sm">{item.role}</TabsTrigger>)}</TabsList></Tabs>
          <div className="mt-3 rounded-lg bg-muted p-3 text-xs leading-relaxed sm:text-sm"><p className="truncate"><span className="text-muted-foreground">Email:</span> {account.email}</p><p><span className="text-muted-foreground">Password:</span> {account.password}</p></div>
          <Button type="button" variant="secondary" className="mt-3 w-full" onClick={() => { setEmail(account.email); setPassword(account.password); }}>Gunakan akun ini</Button>
        </div>
      </CardContent>
    </Card></section>
  </>;
}
