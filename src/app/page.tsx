import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, FileTextIcon, ShieldCheckIcon, StethoscopeIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold tracking-tight">Awesome Journal</span>
        <ThemeToggle />
      </header>
      <section className="relative isolate overflow-hidden bg-background md:min-h-[560px]">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-12 md:min-h-[560px] md:grid-cols-2 md:gap-12 md:py-16">
          <div className="w-full max-w-md space-y-6">
            <p className="text-sm font-medium text-muted-foreground">Your health. Your journal.</p>
            <h1 className="text-5xl leading-tight font-semibold tracking-normal md:text-6xl">
              Awesome
              <br />
              Journal
            </h1>
            <p className="max-w-sm text-base leading-7 text-muted-foreground">
              A clearer view of your health records. Access your journal and stay connected with
              your care team.
            </p>
            <Button asChild className="h-11 gap-3 rounded-md px-6">
              <Link href="/login">
                Sign in
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[480px] p-5 md:p-6">
            <div className="relative h-full w-full overflow-hidden rounded-[48%_52%_45%_55%/55%_42%_58%_45%] border-4 border-background shadow-xl">
              <Image
                src="/images/doctors2.jpg"
                alt="Two healthcare professionals reviewing a medical image together"
                fill
                priority
                sizes="(min-width: 768px) 480px, 100vw"
                className="object-cover object-[75%_center]"
              />
            </div>
            <div
              aria-hidden="true"
              className="absolute top-2 left-8 flex size-14 items-center justify-center rounded-full bg-card text-emerald-700 shadow-lg dark:text-emerald-400"
            >
              <StethoscopeIcon className="size-6" />
            </div>
            <div
              aria-hidden="true"
              className="absolute top-1/2 right-0 flex size-14 items-center justify-center rounded-full bg-card text-sky-700 shadow-lg dark:text-sky-400"
            >
              <ShieldCheckIcon className="size-6" />
            </div>
            <div
              aria-hidden="true"
              className="absolute bottom-4 left-10 flex size-14 items-center justify-center rounded-full bg-card text-foreground shadow-lg"
            >
              <FileTextIcon className="size-6" />
            </div>
          </div>
        </div>
      </section>
      <section className="border-t bg-background px-6 py-8">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2">
          <div className="flex items-start gap-4">
            <FileTextIcon
              className="mt-1 size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-semibold">Your health records</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Medical records and shared notes, together in your journal.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <ShieldCheckIcon
              className="mt-1 size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-semibold">Access with accountability</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Role-based access keeps journal information available to the right people.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
