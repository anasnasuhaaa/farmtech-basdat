create function public.feed_stock(feed_id uuid) returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce((select stok_kg from public.v_stok_pakan where id_pakan=feed_id),0)
$$;
create function public.feed_unit_cost(feed_id uuid) returns numeric language sql stable security definer set search_path = '' as $$
  select case when coalesce(sum(weight),0)=0 then 0 else round(sum(cost)/sum(weight),2) end from (
    select berat_kg weight, harga_total cost from public.pakan_masuk where id_pakan=feed_id
    union all select total_berat,total_biaya from public.mix_pakan where id_pakan_hasil=feed_id
  ) x
$$;
create function public.create_population(
  cage_id uuid, category_id uuid, arrival_date date, initial_count integer,
  arrival_age integer default null, breed text default null, note text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  perform public.require_role(array['Administrator','ABK']);
  if initial_count is null or initial_count<=0 or arrival_date is null or
    (arrival_age is not null and arrival_age<0) then raise exception 'Data populasi tidak valid'; end if;
  insert into public.populasi_ternak(id_kandang,id_kategori_ternak,tanggal_masuk,jumlah_awal,usia_masuk,ras,keterangan,created_by)
  values(cage_id,category_id,arrival_date,initial_count,arrival_age,breed,note,auth.uid()) returning id_populasi into new_id;
  return new_id;
end $$;
create function public.add_population_mutation(population_id uuid, mutation_date date, mutation_type text, amount integer, note text default null)
returns integer language plpgsql security definer set search_path = '' as $$
declare next_no integer; active_count integer; arrival_date date;
begin
  perform public.require_role(array['Administrator','ABK']);
  if amount is null or amount<=0 or mutation_date is null or mutation_type not in ('KEMATIAN','PENJUALAN','PEMINDAHAN','AFKIR') then
    raise exception 'Data mutasi tidak valid'; end if;
  perform 1 from public.populasi_ternak where id_populasi=population_id for update;
  if not found then raise exception 'Populasi tidak ditemukan'; end if;
  select jumlah_aktif,tanggal_masuk into active_count,arrival_date from public.v_populasi_aktif where id_populasi=population_id;
  if mutation_date<arrival_date or amount>active_count then raise exception 'Populasi aktif tidak mencukupi atau tanggal tidak valid'; end if;
  select coalesce(max(no_mutasi),0)+1 into next_no from public.mutasi_populasi where id_populasi=population_id;
  insert into public.mutasi_populasi values(population_id,next_no,mutation_date,mutation_type,amount,note,auth.uid(),now());
  return next_no;
end $$;
create function public.move_population(population_id uuid, new_cage uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_role(array['Administrator']);
  if not exists(select 1 from public.mutasi_populasi where id_populasi=population_id and jenis_mutasi='PEMINDAHAN') then
    raise exception 'Catat mutasi PEMINDAHAN terlebih dahulu'; end if;
  update public.populasi_ternak set id_kandang=new_cage where id_populasi=population_id;
  if not found then raise exception 'Populasi tidak ditemukan'; end if;
end $$;
create function public.create_feed_receipt(feed_id uuid, entry_date date, weight_kg numeric, price_total numeric, note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare receipt_id uuid; transaction_id uuid; category_id uuid;
begin
  perform public.require_role(array['Administrator','ABK']);
  if weight_kg is null or weight_kg<=0 or price_total is null or price_total<0 or entry_date is null then
    raise exception 'Data pakan masuk tidak valid'; end if;
  select id_kategori_keuangan into category_id from public.kategori_keuangan where nama_kategori='Pembelian Pakan' and tipe='PENGELUARAN';
  if category_id is null then raise exception 'Kategori Pembelian Pakan belum tersedia'; end if;
  insert into public.pakan_masuk(id_pakan,tanggal,berat_kg,harga_total,keterangan,created_by)
  values(feed_id,entry_date,weight_kg,price_total,note,auth.uid()) returning id_pakan_masuk into receipt_id;
  insert into public.transaksi_keuangan(id_kategori_keuangan,tanggal,nominal,keterangan,created_by)
  values(category_id,entry_date,price_total,note,auth.uid()) returning id_transaksi into transaction_id;
  insert into public.pengeluaran(id_transaksi,sumber_pengeluaran,id_pakan_masuk)
  values(transaction_id,'Pembelian pakan',receipt_id);
  return receipt_id;
end $$;
create function public.create_feed_mix(mix_date date, mix_name text, result_feed_id uuid, ingredients jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare item jsonb; feed_id uuid; weight numeric; total_weight numeric:=0; total_cost numeric:=0;
  detail_cost numeric; mix_id uuid; detail_no integer:=0; result_type text;
begin
  perform public.require_role(array['Administrator','ABK']);
  if mix_date is null or nullif(trim(mix_name),'') is null or jsonb_typeof(ingredients)<>'array' or jsonb_array_length(ingredients)=0 then
    raise exception 'Mix perlu nama dan minimal satu bahan'; end if;
  select jenis_pakan into result_type from public.pakan where id_pakan=result_feed_id;
  if result_type <> 'HASIL_CAMPURAN' then raise exception 'Pakan hasil harus bertipe HASIL_CAMPURAN'; end if;
  -- A transaction-scoped lock serializes stock-changing RPCs.
  perform pg_advisory_xact_lock(4284101);
  for item in select value from jsonb_array_elements(ingredients) loop
    feed_id := (item->>'id_pakan')::uuid; weight := (item->>'berat_bahan')::numeric;
    if feed_id is null or feed_id=result_feed_id or weight is null or weight<=0 then raise exception 'Bahan mix tidak valid'; end if;
  end loop;
  if exists(select 1 from (select (x->>'id_pakan')::uuid id, sum((x->>'berat_bahan')::numeric) total
    from jsonb_array_elements(ingredients) x group by 1) grouped where grouped.total>public.feed_stock(grouped.id)) then
    raise exception 'Stok pakan tidak mencukupi'; end if;
  for item in select value from jsonb_array_elements(ingredients) loop
    total_weight:=total_weight+(item->>'berat_bahan')::numeric;
    total_cost:=total_cost+round((item->>'berat_bahan')::numeric*public.feed_unit_cost((item->>'id_pakan')::uuid),2);
  end loop;
  insert into public.mix_pakan(tanggal,nama_mix,id_pakan_hasil,total_berat,total_biaya,created_by)
  values(mix_date,trim(mix_name),result_feed_id,total_weight,total_cost,auth.uid()) returning id_mix into mix_id;
  for item in select value from jsonb_array_elements(ingredients) loop
    detail_no:=detail_no+1;
    detail_cost:=round((item->>'berat_bahan')::numeric*public.feed_unit_cost((item->>'id_pakan')::uuid),2);
    insert into public.detail_mix_pakan values(mix_id,detail_no,(item->>'id_pakan')::uuid,(item->>'berat_bahan')::numeric,detail_cost);
  end loop;
  return mix_id;
end $$;
create function public.create_feed_issue(feed_id uuid, cage_id uuid, issue_date date, weight_kg numeric, purpose text, note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare issue_id uuid;
begin
  perform public.require_role(array['Administrator','ABK']);
  if issue_date is null or weight_kg is null or weight_kg<=0 or nullif(trim(purpose),'') is null then
    raise exception 'Data pengeluaran pakan tidak valid'; end if;
  perform pg_advisory_xact_lock(4284101);
  if public.feed_stock(feed_id)<weight_kg then raise exception 'Stok pakan tidak mencukupi'; end if;
  insert into public.pengeluaran_pakan(id_pakan,id_kandang,tanggal,jumlah_kg,tujuan,keterangan,created_by)
  values(feed_id,cage_id,issue_date,weight_kg,trim(purpose),note,auth.uid()) returning id_pakan_keluar into issue_id;
  return issue_id;
end $$;

revoke all on function public.feed_stock(uuid),public.feed_unit_cost(uuid) from public,anon,authenticated;
revoke all on function public.create_population(uuid,uuid,date,integer,integer,text,text),
  public.add_population_mutation(uuid,date,text,integer,text),public.move_population(uuid,uuid),
  public.create_feed_receipt(uuid,date,numeric,numeric,text),public.create_feed_mix(date,text,uuid,jsonb),
  public.create_feed_issue(uuid,uuid,date,numeric,text,text) from public,anon;
grant execute on function public.create_population(uuid,uuid,date,integer,integer,text,text),
  public.add_population_mutation(uuid,date,text,integer,text),public.move_population(uuid,uuid),
  public.create_feed_receipt(uuid,date,numeric,numeric,text),public.create_feed_mix(date,text,uuid,jsonb),
  public.create_feed_issue(uuid,uuid,date,numeric,text,text) to authenticated;
