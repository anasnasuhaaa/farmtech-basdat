import { LoginForm } from "./login-form";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="grid min-h-screen bg-background lg:grid-cols-[1fr_1fr]"><LoginForm error={error} /></main>;
}
