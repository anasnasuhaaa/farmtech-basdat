-- Functions that inspect roles run as their owner so RLS policies do not recurse.
create function public.current_role() returns text language sql stable security definer set search_path = '' as $$
  select case when p.status_akun <> 'AKTIF' then null
    when exists(select 1 from public.administrator a where a.id_pengguna=p.id_pengguna) then 'Administrator'
    when exists(select 1 from public.pemilik x where x.id_pengguna=p.id_pengguna) then 'Pemilik'
    when exists(select 1 from public.abk x where x.id_pengguna=p.id_pengguna) then 'ABK'
    else null end
  from public.pengguna p where p.id_pengguna=auth.uid()
$$;
create function public.require_role(allowed text[]) returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if public.current_role() is null or not (public.current_role() = any(allowed)) then
    raise exception 'Akses tidak diizinkan' using errcode='42501';
  end if;
end $$;

create function public.check_user_subclass() returns trigger language plpgsql security definer set search_path = '' as $$
declare target uuid; count_roles integer;
begin
  if tg_op='DELETE' then target := old.id_pengguna; else target := new.id_pengguna; end if;
  if not exists(select 1 from public.pengguna where id_pengguna=target) then return null; end if;
  select (select count(*) from public.administrator where id_pengguna=target)
       + (select count(*) from public.pemilik where id_pengguna=target)
       + (select count(*) from public.abk where id_pengguna=target) into count_roles;
  if count_roles <> 1 then raise exception 'Pengguna wajib memiliki tepat satu role'; end if;
  return null;
end $$;
create constraint trigger pengguna_role_total after insert or update on public.pengguna
  deferrable initially deferred for each row execute function public.check_user_subclass();
create constraint trigger administrator_role_total after insert or update or delete on public.administrator
  deferrable initially deferred for each row execute function public.check_user_subclass();
create constraint trigger pemilik_role_total after insert or update or delete on public.pemilik
  deferrable initially deferred for each row execute function public.check_user_subclass();
create constraint trigger abk_role_total after insert or update or delete on public.abk
  deferrable initially deferred for each row execute function public.check_user_subclass();

create function public.bootstrap_current_demo_user() returns text language plpgsql security definer set search_path = '' as $$
declare user_email text; role_name text; user_id uuid := auth.uid();
begin
  if user_id is null then raise exception 'Silakan login dahulu' using errcode='42501'; end if;
  select lower(email) into user_email from auth.users where id=user_id and email_confirmed_at is not null;
  role_name := case user_email when 'admin@farmtech.test' then 'Administrator'
    when 'pemilik@farmtech.test' then 'Pemilik' when 'abk@farmtech.test' then 'ABK' end;
  if role_name is null then raise exception 'Akun demo belum terdaftar' using errcode='42501'; end if;
  insert into public.pengguna(id_pengguna,nama,email)
  values(user_id, case role_name when 'Administrator' then 'Administrator Demo' when 'Pemilik' then 'Pemilik Demo' else 'ABK Demo' end,user_email)
  on conflict (id_pengguna) do nothing;
  if (select status_akun from public.pengguna where id_pengguna=user_id) <> 'AKTIF' then
    raise exception 'Akun ini nonaktif' using errcode='42501';
  end if;
  -- Existing role is never reset by repeated login.
  if exists(select 1 from public.administrator where id_pengguna=user_id) then return 'Administrator'; end if;
  if exists(select 1 from public.pemilik where id_pengguna=user_id) then return 'Pemilik'; end if;
  if exists(select 1 from public.abk where id_pengguna=user_id) then return 'ABK'; end if;
  if role_name='Administrator' then insert into public.administrator values(user_id);
  elsif role_name='Pemilik' then insert into public.pemilik values(user_id);
  else insert into public.abk values(user_id); end if;
  return role_name;
end $$;

create function public.update_pengguna(target_id uuid, new_name text, new_status text, new_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_role(array['Administrator']);
  if new_name is null or length(trim(new_name))=0 or new_status not in ('AKTIF','NONAKTIF')
    or new_role not in ('Administrator','Pemilik','ABK') then raise exception 'Data pengguna tidak valid'; end if;
  if target_id=auth.uid() and (new_status<>'AKTIF' or new_role<>'Administrator') then
    raise exception 'Administrator tidak dapat mencabut aksesnya sendiri'; end if;
  update public.pengguna set nama=trim(new_name),status_akun=new_status,updated_at=now() where id_pengguna=target_id;
  if not found then raise exception 'Pengguna tidak ditemukan'; end if;
  delete from public.administrator where id_pengguna=target_id;
  delete from public.pemilik where id_pengguna=target_id;
  delete from public.abk where id_pengguna=target_id;
  if new_role='Administrator' then insert into public.administrator values(target_id);
  elsif new_role='Pemilik' then insert into public.pemilik values(target_id);
  else insert into public.abk values(target_id); end if;
end $$;

-- Deny direct writes to transactions. The atomic RPCs in later migrations own them.
do $$ declare t text; begin
  foreach t in array array['pengguna','administrator','pemilik','abk','kandang','kategori_ternak',
    'populasi_ternak','mutasi_populasi','pakan','pakan_masuk','mix_pakan','detail_mix_pakan',
    'pengeluaran_pakan','panen','kategori_telur','detail_sortir','distribusi_telur',
    'detail_distribusi','kategori_keuangan','transaksi_keuangan','pemasukan','pengeluaran'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;
create policy pengguna_read on public.pengguna for select to authenticated
  using (public.current_role()='Administrator' or id_pengguna=auth.uid());
create policy administrator_read on public.administrator for select to authenticated
  using (public.current_role()='Administrator' or id_pengguna=auth.uid());
create policy pemilik_read on public.pemilik for select to authenticated
  using (public.current_role()='Administrator' or id_pengguna=auth.uid());
create policy abk_read on public.abk for select to authenticated
  using (public.current_role()='Administrator' or id_pengguna=auth.uid());

do $$ declare t text; begin
  foreach t in array array['kandang','kategori_ternak','populasi_ternak','mutasi_populasi',
    'pakan','pakan_masuk','mix_pakan','detail_mix_pakan','pengeluaran_pakan',
    'panen','kategori_telur','detail_sortir','distribusi_telur','detail_distribusi'] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.current_role() in (''Administrator'',''Pemilik'',''ABK''))',t||'_read',t);
  end loop;
  foreach t in array array['kategori_keuangan','transaksi_keuangan','pemasukan','pengeluaran'] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.current_role() in (''Administrator'',''Pemilik''))',t||'_read',t);
  end loop;
  foreach t in array array['kandang','kategori_ternak','pakan','kategori_telur','kategori_keuangan'] loop
    execute format('create policy %I on public.%I for all to authenticated using (public.current_role()=''Administrator'') with check (public.current_role()=''Administrator'')',t||'_admin',t);
  end loop;
end $$;

revoke all on function public.require_role(text[]) from public, anon, authenticated;
revoke all on function public.check_user_subclass() from public, anon, authenticated;
revoke all on function public.bootstrap_current_demo_user() from public, anon;
revoke all on function public.update_pengguna(uuid,text,text,text) from public, anon;
grant execute on function public.bootstrap_current_demo_user() to authenticated;
grant execute on function public.update_pengguna(uuid,text,text,text) to authenticated;
