import test from "node:test";
import assert from "node:assert/strict";
import { dailyMetrics, dateRange } from "../lib/business/metrics.ts";

const layer = new Set(["layer"]);
const flock = (id, date, count, cage = id, category = "layer") => ({ id_populasi: id, id_kategori_ternak: category, id_kandang: cage, tanggal_masuk: date, jumlah_awal: count });
const metric = (populations, mutations, harvests, feed, from = "2026-09-01", to = from) => dailyMetrics(from, to, populations, mutations, harvests, feed, [], layer);

test("HDP uses living hens and daily HHP proxy uses housed hens", () => {
  const birds = [flock("a", "2026-09-01", 1000)];
  assert.equal(metric(birds, [], [{ tanggal: "2026-09-01", id_kandang: "a", jumlah_utuh: 900, berat_utuh_kg: 60 }], [])[0].hdp, 90);
  const result = metric(birds, [{ id_populasi: "a", tanggal: "2026-09-01", jenis_mutasi: "KEMATIAN", jumlah: 100 }], [{ tanggal: "2026-09-01", id_kandang: "a", jumlah_utuh: 810, berat_utuh_kg: 60 }], [])[0];
  assert.equal(result.hdp, 90);
  assert.equal(result.hhp, 81);
});

test("feed issue to intact egg mass is a proxy and zero denominator stays N/A", () => {
  const birds = [flock("a", "2026-09-01", 1000)];
  assert.equal(metric(birds, [], [{ tanggal: "2026-09-01", id_kandang: "a", jumlah_utuh: 900, berat_utuh_kg: 60 }], [{ tanggal: "2026-09-01", id_kandang: "a", jumlah_kg: 120 }])[0].fcr, 2);
  assert.equal(metric(birds, [], [], [])[0].fcr, null);
  assert.equal(metric(birds, [], [{ tanggal: "2026-09-01", id_kandang: "a", jumlah_utuh: 0, berat_utuh_kg: 0 }], [])[0].fcr, null);
});

test("mixed categories and unassigned feed are excluded, cracked egg weight is partial", () => {
  const result = metric([flock("a", "2026-09-01", 1000), flock("b", "2026-09-01", 20, "b", "broiler")], [], [
    { tanggal: "2026-09-01", id_kandang: "a", jumlah_utuh: 80, jumlah_retak: 10, berat_utuh_kg: 5 },
    { tanggal: "2026-09-01", id_kandang: "b", jumlah_utuh: 30, berat_utuh_kg: 2 },
  ], [{ tanggal: "2026-09-01", id_kandang: "a", jumlah_kg: 10 }, { tanggal: "2026-09-01", id_kandang: null, jumlah_kg: 2 }])[0];
  assert.equal(result.eggs, 90);
  assert.equal(result.layerPopulation, 1000);
  assert.equal(result.fcr, 2);
  assert.equal(result.partial, true);
});

test("late flocks, cohort mutations and 30 day history use dated denominators", () => {
  const birds = [flock("a", "2026-09-01", 100, "one"), flock("b", "2026-09-15", 100, "two")];
  const days = metric(birds, [{ id_populasi: "a", tanggal: "2026-09-20", jenis_mutasi: "KEMATIAN", jumlah: 20 }], [], [], "2026-09-01", "2026-09-30");
  assert.equal(days.length, 30);
  assert.equal(days[0].layerPopulation, 100);
  assert.equal(days[14].layerPopulation, 200);
  assert.equal(days[19].layerPopulation, 180);
  assert.equal(days[19].layerInitial, 200);
  assert.equal(days[19].hdp, 0);
});

test("negative cohort population is surfaced rather than clamped", () => {
  const day = metric([flock("a", "2026-09-01", 10)], [{ id_populasi: "a", tanggal: "2026-09-01", jenis_mutasi: "KEMATIAN", jumlah: 11 }], [], [])[0];
  assert.equal(day.populationInconsistent, true);
  assert.equal(day.hdp, null);
});

test("custom dates reject reversed, future and oversized periods", () => {
  assert.equal(dateRange({ period: "custom", from: "2026-09-05", to: "2026-09-01" }, "2026-09-30").invalid, true);
  assert.equal(dateRange({ period: "custom", from: "2026-09-29", to: "2026-10-01" }, "2026-09-30").invalid, true);
  assert.equal(dateRange({ period: "custom", from: "2026-01-01", to: "2026-09-30" }, "2026-09-30").invalid, true);
  assert.equal(dateRange({ period: "7" }, "2026-09-30").from, "2026-09-24");
});
