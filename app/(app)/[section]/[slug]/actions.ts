"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { sections } from "@/lib/sections";

const value = (form: FormData, key: string) => String(form.get(key) || "").trim();
export async function saveSection(path: string, form: FormData) {
  const config = sections[path];
  if (!config || !config.fields.length) redirect("/dashboard");
  const { supabase, role } = await requireSession();
  if (role === "Pemilik" || (config.master && role !== "Administrator") || ((config.adminOnly || config.finance) && role !== "Administrator")) redirect("/dashboard");
  const url = `/${path}`;
  const errorUrl = (message: string) => `${url}?error=${encodeURIComponent(message)}`;
  const operation = value(form, "_operation") || "create";
  let error: { message: string } | null = null;
  if (config.master) {
    const id = value(form, "_id");
    if (operation !== "create" && !id) redirect(errorUrl("Pilih data yang akan diubah."));
    if (operation === "delete") {
      const result = await supabase.from(config.table).delete().eq(config.id, id);
      error = result.error;
    } else {
      const data = Object.fromEntries(config.fields.map(field => [field.name, value(form, field.name) || null]));
      if (config.table === "pakan" && !data.satuan) data.satuan = "kg";
      const result = operation === "edit"
        ? await supabase.from(config.table).update(data).eq(config.id, id)
        : await supabase.from(config.table).insert(data);
      error = result.error;
    }
  } else {
    const details = value(form, "_details");
    let json: unknown[] = [];
    try { json = details ? JSON.parse(details) : []; }
    catch { redirect(errorUrl("Detail tidak valid.")); }
    if (!Array.isArray(json)) redirect(errorUrl("Detail tidak valid."));
    const rpc: Record<string, { name: string; args: Record<string, unknown> }> = {
      create_population: { name: "create_population", args: { cage_id: value(form,"id_kandang"), category_id: value(form,"id_kategori_ternak"), arrival_date: value(form,"tanggal_masuk"), initial_count: Number(value(form,"jumlah_awal")), arrival_age: value(form,"usia_masuk") ? Number(value(form,"usia_masuk")) : null, breed: value(form,"ras") || null, note: value(form,"keterangan") || null } },
      create_feed_receipt: { name: "create_feed_receipt", args: { feed_id: value(form,"id_pakan"), entry_date: value(form,"tanggal"), weight_kg: Number(value(form,"berat_kg")), price_total: Number(value(form,"harga_total")), note: value(form,"keterangan") || null } },
      create_feed_mix: { name: "create_feed_mix", args: { mix_date: value(form,"tanggal"), mix_name: value(form,"nama_mix"), result_feed_id: value(form,"id_pakan_hasil"), ingredients: json } },
      create_feed_issue: { name: "create_feed_issue", args: { feed_id: value(form,"id_pakan"), cage_id: value(form,"id_kandang") || null, issue_date: value(form,"tanggal"), weight_kg: Number(value(form,"jumlah_kg")), purpose: value(form,"tujuan"), note: value(form,"keterangan") || null } },
      create_harvest: { name: "create_harvest", args: { cage_id: value(form,"id_kandang"), harvest_date: value(form,"tanggal"), whole_count: Number(value(form,"jumlah_utuh")), cracked_count: Number(value(form,"jumlah_retak")), whole_weight: Number(value(form,"berat_utuh_kg")), note: value(form,"keterangan") || null } },
      sort_harvest: { name: "sort_harvest", args: { harvest_id: value(form,"id_panen"), details: json } },
      create_egg_distribution: { name: "create_egg_distribution", args: { distribution_date: value(form,"tanggal"), buyer: value(form,"tujuan_pembeli"), details: json, note: value(form,"keterangan") || null } },
      create_manual_finance: { name: "create_manual_finance", args: { finance_type: value(form,"tipe"), category_id: value(form,"id_kategori_keuangan"), entry_date: value(form,"tanggal"), amount: Number(value(form,"nominal")), note: value(form,"keterangan") || null } },
    };
    const target = rpc[config.action || ""];
    if (!target) redirect(errorUrl("Operasi belum tersedia."));
    const result = await supabase.rpc(target.name, target.args);
    error = result.error;
  }
  if (error) {
    const message = error.message.toLowerCase();
    redirect(errorUrl(message.includes("stok") ? "Stok tidak mencukupi." : message.includes("dependency") || message.includes("foreign key") ? "Data masih digunakan dan tidak dapat dihapus." : message.includes("kategori") ? "Kategori tidak sesuai." : "Pencatatan gagal. Periksa data dan coba lagi."));
  }
  revalidatePath(url);
  redirect(`${url}?success=${encodeURIComponent("Data berhasil disimpan.")}`);
}

export async function cancelSection(path: string, id: string) {
  const kinds: Record<string, string> = {
    "pakan/masuk": "pakan_masuk", "pakan/mix": "mix_pakan", "pakan/keluar": "pengeluaran_pakan",
    "telur/panen": "panen", "telur/distribusi": "distribusi_telur", "keuangan/transaksi": "transaksi_keuangan",
  };
  const kind = kinds[path];
  if (!kind) redirect("/dashboard");
  const { supabase } = await requireSession(["Administrator"]);
  const { error } = await supabase.rpc("cancel_operation", { kind, target_id: id });
  if (error) redirect(`/${path}?error=${encodeURIComponent(error.message.includes("Stok") ? "Stok yang sudah dipakai menghalangi pembatalan." : "Pembatalan gagal. Periksa relasi transaksi.")}`);
  revalidatePath(`/${path}`);
  redirect(`/${path}?success=${encodeURIComponent("Transaksi dibatalkan. Buat ulang jika perlu koreksi.")}`);
}
