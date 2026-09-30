import type { createClient } from "./server";
import type { Row } from "@/lib/business/metrics";

type Client = NonNullable<Awaited<ReturnType<typeof createClient>>>;

// Supabase REST defaults to a 1000-row cap. Page until complete for accurate totals.
export async function loadAll(client: Client, table: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from(table).select("*").range(offset, offset + 999);
    if (error) throw new Error(`Gagal membaca ${table}`);
    rows.push(...((data || []) as Row[]));
    if (!data || data.length < 1000) return rows;
  }
}
