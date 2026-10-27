-- DEMO ONLY. Creates confirmed accounts without sending verification emails.
-- Only the three reserved @farmtech.test accounts are updated on a repeated seed.
set local search_path = public, extensions;

do $$
declare
  account record;
  user_id uuid;
begin
  for account in select * from (values
    ('admin@farmtech.test', 'Admin123!', 'Administrator Demo', 'Administrator'),
    ('pemilik@farmtech.test', 'Pemilik123!', 'Pemilik Demo', 'Pemilik'),
    ('abk@farmtech.test', 'Abk123!', 'ABK Demo', 'ABK')
  ) as demo(email, password, name, role_name) loop
    select id into user_id from auth.users where lower(email) = account.email;
    if user_id is null then
      user_id := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated',
        account.email, crypt(account.password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', account.name, 'email_verified', true), now(), now(), '', '', '', ''
      );
    else
      update auth.users set encrypted_password = crypt(account.password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()), banned_until = null,
        raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
          || '{"provider":"email","providers":["email"]}'::jsonb,
        confirmation_token = '', recovery_token = '', email_change_token_new = '',
        email_change = '', updated_at = now()
      where id = user_id;
    end if;

    insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
    values (gen_random_uuid(), user_id, user_id::text, 'email',
      jsonb_build_object('sub', user_id::text, 'email', account.email, 'email_verified', true), now(), now())
    on conflict (provider_id, provider) do update
      set identity_data = excluded.identity_data, updated_at = now();

    insert into public.pengguna (id_pengguna, nama, email, status_akun)
    values (user_id, account.name, account.email, 'AKTIF')
    on conflict (id_pengguna) do update
      set nama = excluded.nama, email = excluded.email, status_akun = 'AKTIF', updated_at = now();
    delete from public.administrator where id_pengguna = user_id;
    delete from public.pemilik where id_pengguna = user_id;
    delete from public.abk where id_pengguna = user_id;
    if account.role_name = 'Administrator' then insert into public.administrator values (user_id);
    elsif account.role_name = 'Pemilik' then insert into public.pemilik values (user_id);
    else insert into public.abk values (user_id);
    end if;
  end loop;
end $$;

-- A small, consistent farm dataset makes the dashboard and stock pages usable.
-- Seed once; subsequent setup runs preserve demo operations entered in the app.
do $$
declare
  admin_id uuid;
  cage_id uuid;
  category_id uuid;
  feed_id uuid;
  egg_id uuid;
  harvest_id uuid;
  day date;
  today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  if exists (select 1 from public.populasi_ternak where keterangan = '[DEMO] Populasi awal Farm Tech') then
    return;
  end if;
  select id into admin_id from auth.users where email = 'admin@farmtech.test';
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  select id_kandang into cage_id from public.kandang where nama_kandang = 'Kandang Layer A';
  select id_kategori_ternak into category_id from public.kategori_ternak where nama_kategori = 'Ayam Petelur';
  select id_pakan into feed_id from public.pakan where nama_pakan = 'Pakan Layer';
  select id_kategori_telur into egg_id from public.kategori_telur where nama_kategori = 'Telur Coklat';

  perform public.create_population(cage_id, category_id, today - 30, 1000, 20, 'Isa Brown', '[DEMO] Populasi awal Farm Tech');
  perform public.create_feed_receipt(feed_id, today - 7, 2000, 14000000, '[DEMO] Stok pakan awal');
  for day in select generate_series(today - 6, today, interval '1 day')::date loop
    perform public.create_feed_issue(feed_id, cage_id, day, 110, 'Pakan harian petelur', '[DEMO] Pakan harian');
    harvest_id := public.create_harvest(cage_id, day, 900, 0, 54, '[DEMO] Panen harian');
    perform public.sort_harvest(harvest_id, jsonb_build_array(jsonb_build_object('id_kategori_telur', egg_id, 'jumlah_telur', 900)));
    perform public.create_egg_distribution(day, 'Toko Telur Demo',
      jsonb_build_array(jsonb_build_object('id_kategori_telur', egg_id, 'jumlah_telur', 600, 'harga_satuan', 2000)),
      '[DEMO] Penjualan telur');
  end loop;
  perform set_config('request.jwt.claim.sub', '', true);
end $$;
