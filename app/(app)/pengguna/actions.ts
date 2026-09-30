"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";

export async function updateUser(form: FormData) {
  const { supabase } = await requireSession(["Administrator"]);
  const { error } = await supabase.rpc("update_pengguna", {
    target_id: String(form.get("id") || ""), new_name: String(form.get("nama") || ""),
    new_status: String(form.get("status") || ""), new_role: String(form.get("role") || ""),
  });
  if (error) redirect(`/pengguna?error=${encodeURIComponent("Perubahan gagal. Periksa data dan hak akses.")}`);
  revalidatePath("/pengguna");
  redirect("/pengguna?success=Pengguna%20diperbarui");
}
