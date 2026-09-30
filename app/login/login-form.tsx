"use client";
import { useState } from "react";
import { demoAccounts } from "@/lib/demo-accounts";
import { login } from "./actions";
export function LoginForm({ error }: { error?: string }) {
  const [active, setActive] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
    <h1 className="text-2xl font-semibold">Farm Tech</h1><p className="mt-1 text-sm text-muted-foreground">Masuk untuk mengelola peternakan.</p>
    <div className="mt-6 flex rounded-lg border p-1" role="tablist" aria-label="Akun demo">
      {demoAccounts.map((account, index) => <button key={account.role} type="button" role="tab" aria-selected={active===index} onClick={() => setActive(index)} className={`flex-1 rounded-md p-2 text-sm ${active===index ? "bg-primary text-primary-foreground" : ""}`}>{account.role}</button>)}
    </div>
    <div className="mt-3 rounded-lg bg-muted p-3 text-sm"><p>Email: {demoAccounts[active].email}</p><p>Password: {demoAccounts[active].password}</p>
      <button type="button" className="mt-2 underline" onClick={() => { setEmail(demoAccounts[active].email); setPassword(demoAccounts[active].password); }}>Gunakan akun ini</button></div>
    <form action={login} className="mt-5 space-y-4">
      <label className="block text-sm font-medium">Email<input required type="email" name="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2" /></label>
      <label className="block text-sm font-medium">Password<input required type="password" name="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2" /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button className="w-full rounded-md bg-primary p-2 text-primary-foreground">Login</button>
    </form>
  </div>;
}
