import { Badge } from "@/components/ui/badge";

const label: Record<string, string> = {
  BAHAN_BAKU: "Bahan baku", PAKAN_JADI: "Pakan jadi", HASIL_CAMPURAN: "Hasil campuran",
  PEMASUKAN: "Pemasukan", PENGELUARAN: "Pengeluaran",
  KEMATIAN: "Kematian", PENJUALAN: "Penjualan", PEMINDAHAN: "Pemindahan", AFKIR: "Afkir",
  AKTIF: "Aktif", NONAKTIF: "Nonaktif",
};
export function StatusBadge({ value }: { value: string }) {
  const tone = ["PENGELUARAN", "KEMATIAN", "NONAKTIF"].includes(value) ? "bg-destructive/10 text-destructive" : ["BAHAN_BAKU", "AFKIR", "PENJUALAN"].includes(value) ? "bg-[color-mix(in_srgb,var(--chart-feed)_14%,transparent)] text-foreground" : "bg-secondary text-secondary-foreground";
  return <Badge variant="secondary" className={tone}>{label[value] || value}</Badge>;
}
