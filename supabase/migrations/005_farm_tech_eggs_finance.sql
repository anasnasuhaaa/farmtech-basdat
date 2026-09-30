-- Run after 004. All multi-table writes below run in one PostgreSQL transaction.
create function public.egg_stock(category_id uuid) returns integer language sql stable security definer set search_path = '' as $$
  select coalesce((select stok_telur from public.v_stok_telur where id_kategori_telur=category_id),0)::integer
$$;

create function public.create_harvest(cage_id uuid, harvest_date date, whole_count integer, cracked_count integer,
  whole_weight numeric, note text default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare harvest_id uuid;
begin
  perform public.require_role(array['Administrator','ABK']);
  if harvest_date is null or whole_count is null or cracked_count is null or whole_weight is null
    or whole_count<0 or cracked_count<0 or whole_weight<0 then
    raise exception 'Data panen tidak valid'; end if;
  insert into public.panen(id_kandang,tanggal,jumlah_utuh,jumlah_retak,berat_utuh_kg,keterangan,created_by)
  values(cage_id,harvest_date,whole_count,cracked_count,whole_weight,note,auth.uid()) returning id_panen into harvest_id;
  return harvest_id;
end $$;

create function public.sort_harvest(harvest_id uuid, details jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare item jsonb; expected integer; total integer:=0; detail_no integer:=0;
begin
  perform public.require_role(array['Administrator','ABK']);
  if jsonb_typeof(details) is distinct from 'array' or jsonb_array_length(details)=0 then raise exception 'Detail sortir wajib diisi'; end if;
  perform pg_advisory_xact_lock(4284102);
  select jumlah_utuh+jumlah_retak into expected from public.panen where id_panen=harvest_id for update;
  if expected is null then raise exception 'Panen tidak ditemukan'; end if;
  if exists(select 1 from public.detail_sortir where id_panen=harvest_id) then raise exception 'Panen sudah disortir'; end if;
  for item in select value from jsonb_array_elements(details) loop
    if nullif(item->>'id_kategori_telur','') is null or (item->>'jumlah_telur')::integer<=0 then
      raise exception 'Detail sortir tidak valid'; end if;
    total:=total+(item->>'jumlah_telur')::integer;
  end loop;
  if total<>expected then raise exception 'Jumlah sortir harus sama dengan jumlah panen'; end if;
  for item in select value from jsonb_array_elements(details) loop
    detail_no:=detail_no+1;
    insert into public.detail_sortir(id_panen,no_detail,id_kategori_telur,jumlah_telur)
    values(harvest_id,detail_no,(item->>'id_kategori_telur')::uuid,(item->>'jumlah_telur')::integer);
  end loop;
end $$;

create function public.create_egg_distribution(distribution_date date, buyer text, details jsonb, note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare item jsonb; distribution_id uuid; transaction_id uuid; category_id uuid;
  detail_no integer:=0; total numeric:=0; quantity integer; unit_price numeric;
begin
  perform public.require_role(array['Administrator','ABK']);
  if distribution_date is null or nullif(trim(buyer),'') is null or jsonb_typeof(details) is distinct from 'array'
    or jsonb_array_length(details)=0 then raise exception 'Distribusi perlu pembeli dan detail'; end if;
  perform pg_advisory_xact_lock(4284102);
  for item in select value from jsonb_array_elements(details) loop
    quantity:=(item->>'jumlah_telur')::integer; unit_price:=(item->>'harga_satuan')::numeric;
    if nullif(item->>'id_kategori_telur','') is null or quantity is null or quantity<=0
      or unit_price is null or unit_price<0 then raise exception 'Detail distribusi tidak valid'; end if;
    total:=total+round(quantity*unit_price,2);
  end loop;
  if exists(select 1 from (
    select (x->>'id_kategori_telur')::uuid id, sum((x->>'jumlah_telur')::integer) quantity
    from jsonb_array_elements(details) x group by 1
  ) grouped where grouped.quantity>public.egg_stock(grouped.id)) then
    raise exception 'Stok telur tidak mencukupi'; end if;
  select id_kategori_keuangan into category_id from public.kategori_keuangan
    where nama_kategori='Penjualan Telur' and tipe='PEMASUKAN';
  if category_id is null then raise exception 'Kategori Penjualan Telur belum tersedia'; end if;
  insert into public.distribusi_telur(tanggal,tujuan_pembeli,total_harga,keterangan,created_by)
  values(distribution_date,trim(buyer),total,note,auth.uid()) returning id_distribusi into distribution_id;
  for item in select value from jsonb_array_elements(details) loop
    detail_no:=detail_no+1;
    quantity:=(item->>'jumlah_telur')::integer; unit_price:=(item->>'harga_satuan')::numeric;
    insert into public.detail_distribusi(id_distribusi,no_detail,id_kategori_telur,jumlah_telur,harga_satuan,subtotal)
    values(distribution_id,detail_no,(item->>'id_kategori_telur')::uuid,quantity,unit_price,round(quantity*unit_price,2));
  end loop;
  insert into public.transaksi_keuangan(id_kategori_keuangan,tanggal,nominal,keterangan,created_by)
  values(category_id,distribution_date,total,note,auth.uid()) returning id_transaksi into transaction_id;
  insert into public.pemasukan(id_transaksi,sumber_pemasukan,id_distribusi)
  values(transaction_id,'Penjualan telur',distribution_id);
  return distribution_id;
end $$;

create function public.create_manual_finance(finance_type text, category_id uuid, entry_date date, amount numeric,
  note text default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare transaction_id uuid; category_type text; category_name text; role_name text;
begin
  role_name:=public.current_role();
  perform public.require_role(array['Administrator','ABK']);
  if finance_type not in ('PEMASUKAN','PENGELUARAN') or entry_date is null or amount is null or amount<=0 then
    raise exception 'Data keuangan tidak valid'; end if;
  select tipe,nama_kategori into category_type,category_name from public.kategori_keuangan where id_kategori_keuangan=category_id;
  if category_type is distinct from finance_type then raise exception 'Kategori keuangan tidak sesuai'; end if;
  if role_name='ABK' and (finance_type<>'PEMASUKAN' or category_name<>'Pemasukan Lainnya') then
    raise exception 'ABK hanya dapat mencatat pemasukan lainnya' using errcode='42501'; end if;
  insert into public.transaksi_keuangan(id_kategori_keuangan,tanggal,nominal,keterangan,created_by)
  values(category_id,entry_date,amount,note,auth.uid()) returning id_transaksi into transaction_id;
  if finance_type='PEMASUKAN' then
    insert into public.pemasukan(id_transaksi,sumber_pemasukan) values(transaction_id,'Pemasukan manual');
  else
    insert into public.pengeluaran(id_transaksi,sumber_pengeluaran) values(transaction_id,'Pengeluaran manual');
  end if;
  return transaction_id;
end $$;

create function public.create_abk_income(entry_date date, amount numeric, note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare category_id uuid;
begin
  perform public.require_role(array['ABK']);
  select id_kategori_keuangan into category_id from public.kategori_keuangan
    where nama_kategori='Pemasukan Lainnya' and tipe='PEMASUKAN';
  if category_id is null then raise exception 'Kategori Pemasukan Lainnya belum tersedia'; end if;
  return public.create_manual_finance('PEMASUKAN',category_id,entry_date,amount,note);
end $$;

-- A financial superclass row must have exactly one matching subclass and category type.
create function public.check_finance_subclass() returns trigger language plpgsql security definer set search_path = '' as $$
declare target uuid; income_count integer; expense_count integer; category_type text;
begin
  target:=case when tg_op='DELETE' then old.id_transaksi else new.id_transaksi end;
  select k.tipe into category_type from public.transaksi_keuangan t join public.kategori_keuangan k
    on k.id_kategori_keuangan=t.id_kategori_keuangan where t.id_transaksi=target;
  if category_type is null then return null; end if;
  select count(*) into income_count from public.pemasukan where id_transaksi=target;
  select count(*) into expense_count from public.pengeluaran where id_transaksi=target;
  if income_count+expense_count<>1 or (category_type='PEMASUKAN' and income_count<>1)
    or (category_type='PENGELUARAN' and expense_count<>1) then
    raise exception 'Transaksi harus memiliki tepat satu subclass yang sesuai'; end if;
  return null;
end $$;
create constraint trigger transaksi_subclass after insert or update on public.transaksi_keuangan
  deferrable initially deferred for each row execute function public.check_finance_subclass();
create constraint trigger pemasukan_subclass after insert or update or delete on public.pemasukan
  deferrable initially deferred for each row execute function public.check_finance_subclass();
create constraint trigger pengeluaran_subclass after insert or update or delete on public.pengeluaran
  deferrable initially deferred for each row execute function public.check_finance_subclass();

create function public.prevent_category_type_change() returns trigger language plpgsql set search_path = '' as $$
begin
  if old.tipe<>new.tipe and exists(select 1 from public.transaksi_keuangan
    where id_kategori_keuangan=old.id_kategori_keuangan) then
    raise exception 'Tipe kategori yang sudah dipakai tidak dapat diubah'; end if;
  return new;
end $$;
create trigger category_type_guard before update on public.kategori_keuangan
  for each row execute function public.prevent_category_type_change();

create view public.v_buku_keuangan with (security_invoker = true) as
select t.*, k.tipe, k.nama_kategori,
  case when k.tipe='PEMASUKAN' then t.nominal else -t.nominal end as nominal_bertanda
from public.transaksi_keuangan t join public.kategori_keuangan k using (id_kategori_keuangan);

-- Correction is cancel and re-enter. Historical dependent stock is checked before cancellation.
create function public.cancel_operation(kind text, target_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare feed_id uuid; category_id uuid; weight numeric; quantity integer;
begin
  perform public.require_role(array['Administrator']);
  perform pg_advisory_xact_lock(4284101);
  perform pg_advisory_xact_lock(4284102);
  if kind='pakan_masuk' then
    select id_pakan,berat_kg into feed_id,weight from public.pakan_masuk where id_pakan_masuk=target_id for update;
    if feed_id is null then raise exception 'Pakan masuk tidak ditemukan'; end if;
    if public.feed_stock(feed_id)<weight then raise exception 'Stok pakan tidak mencukupi untuk pembatalan'; end if;
    delete from public.transaksi_keuangan where id_transaksi=(select id_transaksi from public.pengeluaran where id_pakan_masuk=target_id);
    delete from public.pakan_masuk where id_pakan_masuk=target_id;
  elsif kind='pengeluaran_pakan' then
    delete from public.pengeluaran_pakan where id_pakan_keluar=target_id;
  elsif kind='mix_pakan' then
    select id_pakan_hasil,total_berat into feed_id,weight from public.mix_pakan where id_mix=target_id for update;
    if feed_id is null then raise exception 'Mix tidak ditemukan'; end if;
    if public.feed_stock(feed_id)<weight then raise exception 'Stok pakan hasil tidak mencukupi untuk pembatalan'; end if;
    delete from public.mix_pakan where id_mix=target_id;
  elsif kind='distribusi_telur' then
    if not exists(select 1 from public.distribusi_telur where id_distribusi=target_id) then raise exception 'Distribusi tidak ditemukan'; end if;
    delete from public.transaksi_keuangan where id_transaksi=(select id_transaksi from public.pemasukan where id_distribusi=target_id);
    delete from public.distribusi_telur where id_distribusi=target_id;
  elsif kind='panen' then
    if not exists(select 1 from public.panen where id_panen=target_id) then raise exception 'Panen tidak ditemukan'; end if;
    for category_id,quantity in select id_kategori_telur,sum(jumlah_telur)::integer from public.detail_sortir
      where id_panen=target_id group by id_kategori_telur loop
      if public.egg_stock(category_id)<quantity then raise exception 'Stok telur tidak mencukupi untuk pembatalan'; end if;
    end loop;
    delete from public.panen where id_panen=target_id;
  elsif kind='transaksi_keuangan' then
    if exists(select 1 from public.pemasukan where id_transaksi=target_id and id_distribusi is not null)
      or exists(select 1 from public.pengeluaran where id_transaksi=target_id and id_pakan_masuk is not null) then
      raise exception 'Batalkan transaksi operasional sumber terlebih dahulu'; end if;
    delete from public.transaksi_keuangan where id_transaksi=target_id;
  else raise exception 'Jenis pembatalan tidak dikenal'; end if;
end $$;

revoke all on function public.egg_stock(uuid) from public, anon, authenticated;
revoke all on function public.check_finance_subclass() from public, anon, authenticated;
revoke all on function public.prevent_category_type_change() from public, anon, authenticated;
revoke all on function public.create_harvest(uuid,date,integer,integer,numeric,text) from public, anon;
revoke all on function public.sort_harvest(uuid,jsonb) from public, anon;
revoke all on function public.create_egg_distribution(date,text,jsonb,text) from public, anon;
revoke all on function public.create_manual_finance(text,uuid,date,numeric,text) from public, anon;
revoke all on function public.create_abk_income(date,numeric,text) from public, anon;
revoke all on function public.cancel_operation(text,uuid) from public, anon;
grant execute on function public.create_harvest(uuid,date,integer,integer,numeric,text) to authenticated;
grant execute on function public.sort_harvest(uuid,jsonb) to authenticated;
grant execute on function public.create_egg_distribution(date,text,jsonb,text) to authenticated;
grant execute on function public.create_manual_finance(text,uuid,date,numeric,text) to authenticated;
grant execute on function public.create_abk_income(date,numeric,text) to authenticated;
grant execute on function public.cancel_operation(text,uuid) to authenticated;
