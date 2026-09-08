import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Awesome Journal
        </Link>
        <ThemeToggle />
      </header>
      <section className="flex flex-1 items-center justify-center p-4">
        <LoginForm />
      </section>
    </main>
  );
}
