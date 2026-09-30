"use server";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";

export async function saveIncome(form: FormData) {
  const { supabase } = await requireSession(["ABK"]);
  const date = String(form.get("tanggal") || "");
  const amount = Number(form.get("nominal"));
  if (!date || !Number.isFinite(amount) || amount <= 0) redirect("/pemasukan?error=Data%20tidak%20valid");
  const { error } = await supabase.rpc("create_abk_income", {
    entry_date: date, amount, note: String(form.get("keterangan") || "") || null,
  });
  if (error) redirect("/pemasukan?error=Pencatatan%20gagal");
  redirect("/pemasukan?success=Pemasukan%20tersimpan");
}
