-- Keep helper costing private. Operational RPCs are callable only by authenticated users;
-- each still checks the active application role internally.
grant usage on schema public to authenticated;
grant select on public.pengguna, public.administrator, public.pemilik, public.abk,
  public.kandang, public.kategori_ternak, public.populasi_ternak, public.mutasi_populasi,
  public.pakan, public.pakan_masuk, public.mix_pakan, public.detail_mix_pakan,
  public.pengeluaran_pakan, public.panen, public.kategori_telur, public.detail_sortir,
  public.distribusi_telur, public.detail_distribusi, public.kategori_keuangan,
  public.transaksi_keuangan, public.pemasukan, public.pengeluaran,
  public.v_populasi_aktif, public.v_stok_pakan, public.v_stok_telur, public.v_buku_keuangan
  to authenticated;
grant insert, update, delete on public.kandang, public.kategori_ternak, public.pakan,
  public.kategori_telur, public.kategori_keuangan to authenticated;
revoke all on function public.feed_stock(uuid) from public, anon, authenticated;
revoke all on function public.feed_unit_cost(uuid) from public, anon, authenticated;
revoke all on function public.create_population(uuid,uuid,date,integer,integer,text,text) from public, anon;
revoke all on function public.add_population_mutation(uuid,date,text,integer,text) from public, anon;
revoke all on function public.move_population(uuid,uuid) from public, anon;
revoke all on function public.create_feed_receipt(uuid,date,numeric,numeric,text) from public, anon;
revoke all on function public.create_feed_mix(date,text,uuid,jsonb) from public, anon;
revoke all on function public.create_feed_issue(uuid,uuid,date,numeric,text,text) from public, anon;
grant execute on function public.create_population(uuid,uuid,date,integer,integer,text,text) to authenticated;
grant execute on function public.add_population_mutation(uuid,date,text,integer,text) to authenticated;
grant execute on function public.move_population(uuid,uuid) to authenticated;
grant execute on function public.create_feed_receipt(uuid,date,numeric,numeric,text) to authenticated;
grant execute on function public.create_feed_mix(date,text,uuid,jsonb) to authenticated;
grant execute on function public.create_feed_issue(uuid,uuid,date,numeric,text,text) to authenticated;
