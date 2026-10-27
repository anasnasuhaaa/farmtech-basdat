import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { demoAccounts } from '../lib/demo-accounts.ts';

nextEnv.loadEnvConfig(process.cwd(), true);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function verify() {
  if (!url || !key) throw new Error('Isi konfigurasi API Supabase di .env.');
  for (const account of demoAccounts) {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    try {
      const { error } = await client.auth.signInWithPassword(account);
      if (error) throw new Error(`${account.role}: login gagal (${error.code || error.status}). Jalankan setup database terlebih dahulu.`);
      const { data: role, error: roleError } = await client.rpc('current_role');
      if (roleError || role !== account.role) throw new Error(`${account.role}: role database tidak sesuai.`);
      for (const table of ['pengguna', 'kandang', 'kategori_ternak', 'populasi_ternak', 'mutasi_populasi', 'panen', 'pengeluaran_pakan', 'v_stok_pakan', 'v_stok_telur']) {
        const result = await client.from(table).select('*').limit(1);
        if (result.error) throw new Error(`${account.role}: gagal membaca ${table} (${result.error.code}).`);
      }
      const finance = await client.from('v_buku_keuangan').select('*').limit(1);
      if (finance.error || (account.role === 'ABK' && finance.data.length)) throw new Error(`${account.role}: izin keuangan tidak sesuai.`);
      console.log(`${account.role}: login, role, akses dashboard, dan RLS keuangan OK`);
    } finally {
      await client.auth.signOut({ scope: 'local' });
    }
  }
}

verify().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
