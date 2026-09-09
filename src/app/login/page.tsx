import Link from "next/link";
import Image from "next/image";

import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-muted/40">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="font-semibold tracking-tight">
          Awesome Journal
        </Link>
        <ThemeToggle />
      </header>
      <section className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-xl bg-background shadow-xl ring-1 ring-border md:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
          <div className="flex items-center justify-center p-6 md:p-10">
            <LoginForm />
          </div>
          <div className="relative min-h-[320px] overflow-hidden bg-emerald-600 md:min-h-[520px]">
            <Image
              src="/images/login-healthcare.jpg"
              alt="Healthcare professional with a medical journal"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-emerald-950/10" />
            <div className="absolute right-6 bottom-6 left-6 rounded-lg bg-background/90 p-4 text-sm shadow-lg backdrop-blur">
              <p className="font-medium">Every access is logged.</p>
              <p className="mt-1 text-muted-foreground">
                Patients can review who opened their journal.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
