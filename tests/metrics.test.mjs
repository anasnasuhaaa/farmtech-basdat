import test from "node:test";
import assert from "node:assert/strict";
import { dailyMetrics, dateRange } from "../lib/business/metrics.ts";

test("historical population and daily HDP/HHP/FCR use dated transactions", () => {
  const days = dailyMetrics("2026-09-01", "2026-09-03",
    [{ tanggal_masuk: "2026-09-01", jumlah_awal: 100 }],
    [{ tanggal: "2026-09-02", jenis_mutasi: "KEMATIAN", jumlah: 10 },
      { tanggal: "2026-09-03", jenis_mutasi: "PEMINDAHAN", jumlah: 20 }],
    [{ tanggal: "2026-09-02", jumlah_utuh: 45, jumlah_retak: 0, berat_utuh_kg: 2.5 }],
    [{ tanggal: "2026-09-02", jumlah_kg: 5 }],
    [{ tanggal: "2026-09-02", tipe: "PEMASUKAN", nominal: 12000 },
      { tanggal: "2026-09-02", tipe: "PENGELUARAN", nominal: 2000 }]);
  assert.equal(days[0].population, 100);
  assert.equal(days[1].population, 90);
  assert.equal(days[2].population, 90);
  assert.equal(days[1].hdp, 50);
  assert.equal(days[1].hhp, 45);
  assert.equal(days[1].fcr, 2);
  assert.equal(days[1].income - days[1].expense, 10000);
  assert.equal(days[0].fcr, null);
});

test("custom dates reject reversed and oversized periods", () => {
  assert.equal(dateRange({ period: "custom", from: "2026-09-05", to: "2026-09-01" }, "2026-09-30").invalid, true);
  assert.equal(dateRange({ period: "custom", from: "2026-01-01", to: "2026-09-30" }, "2026-09-30").invalid, true);
  assert.equal(dateRange({ period: "7" }, "2026-09-30").from, "2026-09-24");
});
