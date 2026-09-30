import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { logout } from "@/app/login/actions";
export default async function MorePage() {
  const { role } = await requireSession();
  return <><h1 className="text-2xl font-semibold">Lainnya</h1><div className="mt-4 flex flex-col gap-3">
    {role !== "ABK" && <><Link href="/keuangan/transaksi">Keuangan</Link><Link href="/keuangan/laporan">Laporan</Link></>}
    {role === "Administrator" && <Link href="/pengguna">Pengguna</Link>}
    <form action={logout}><button className="underline">Logout</button></form>
  </div></>;
}
