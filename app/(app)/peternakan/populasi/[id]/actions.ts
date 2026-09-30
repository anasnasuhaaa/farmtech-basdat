"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
export async function recordMutation(id: string, form: FormData) {
  const { supabase, role } = await requireSession();
  if (role === "Pemilik") redirect("/dashboard");
  const { error } = await supabase.rpc("add_population_mutation", {
    population_id: id, mutation_date: String(form.get("tanggal") || ""),
    mutation_type: String(form.get("jenis_mutasi") || ""), amount: Number(form.get("jumlah")),
    note: String(form.get("keterangan") || "") || null,
  });
  const path = `/peternakan/populasi/${id}`;
  if (error) redirect(`${path}?error=${encodeURIComponent("Mutasi gagal. Periksa jumlah aktif dan tanggal.")}`);
  revalidatePath(path); redirect(`${path}?success=Mutasi%20tersimpan`);
}
export async function moveCage(id: string, form: FormData) {
  const { supabase } = await requireSession(["Administrator"]);
  const { error } = await supabase.rpc("move_population", { population_id: id, new_cage: String(form.get("id_kandang") || "") });
  const path = `/peternakan/populasi/${id}`;
  if (error) redirect(`${path}?error=${encodeURIComponent("Pindah kandang gagal. Catat mutasi PEMINDAHAN lebih dahulu.")}`);
  revalidatePath(path); redirect(`${path}?success=Kandang%20diperbarui`);
}
