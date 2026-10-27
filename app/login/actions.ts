"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { demoAccounts } from "@/lib/demo-accounts";

async function signIn(email: string, password: string, expectedRole?: string) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=Konfigurasi%20Supabase%20belum%20diisi");
  if (!email || !password) redirect("/login?error=Email%20dan%20password%20wajib%20diisi");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message = expectedRole
      ? "Akun demo belum dapat digunakan. Hubungi pengelola aplikasi."
      : "Email atau password salah";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }
  const { data: role, error: roleError } = await supabase.rpc("current_role");
  if (roleError || !["Administrator", "Pemilik", "ABK"].includes(role) || (expectedRole && role !== expectedRole)) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/login?error=Akun%20tidak%20aktif%20atau%20role%20belum%20sesuai");
  }
  redirect("/dashboard");
}

export async function login(formData: FormData) {
  await signIn(String(formData.get("email") || "").trim(), String(formData.get("password") || ""));
}

export async function loginDemo(formData: FormData) {
  const account = demoAccounts.find(item => item.role === formData.get("role"));
  if (!account) redirect("/login?error=Role%20demo%20tidak%20valid");
  await signIn(account.email, account.password, account.role);
}

export async function logout() {
  const supabase = await createClient();
  await supabase?.auth.signOut({ scope: "local" });
  redirect("/login");
}
