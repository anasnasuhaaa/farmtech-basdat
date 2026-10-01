import { LoginForm } from "./login-form";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="grid min-h-screen min-w-0 grid-cols-[minmax(0,1fr)] bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><LoginForm error={error} /></main>;
}
