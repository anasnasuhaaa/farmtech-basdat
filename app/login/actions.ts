"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function login(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=Konfigurasi%20Supabase%20belum%20diisi");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/login?error=Email%20dan%20password%20wajib%20diisi");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=Email%20atau%20password%20salah");
  const bootstrap = await supabase.rpc("bootstrap_current_demo_user");
  if (bootstrap.error) {
    await supabase.auth.signOut();
    redirect("/login?error=Akun%20tidak%20aktif%20atau%20belum%20diizinkan");
  }
  redirect("/dashboard");
}
export async function logout() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/login");
}
