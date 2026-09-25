"use client";

import Image from "next/image";
import Link from "next/link";
import { ActivityIcon, FileTextIcon, SearchIcon, ShieldCheckIcon } from "lucide-react";

import { roleLabel } from "@/components/auth/mock-auth";
import { AppHeader } from "@/components/common/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionUser } from "@/lib/types/api";

const staffRoles = new Set(["doctor", "nurse", "ambulance"]);

export function DashboardShell({ user }: { user: SessionUser }) {
  const isStaff = staffRoles.has(user.role);
  const ownPatientId = user.patientId;

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />
      <section className="relative overflow-hidden border-b bg-primary px-4 py-10 text-primary-foreground md:min-h-[360px] md:px-6 md:py-14">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.16),transparent_48%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden [clip-path:ellipse(88%_82%_at_82%_50%)] md:block">
          <Image
            src="/images/doctors.jpg"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="46vw"
          />
          <div className="absolute inset-0 bg-primary/20" />
        </div>
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 md:min-h-[250px] md:grid-cols-[minmax(0,520px)_1fr]">
          <div className="z-10 flex max-w-[520px] flex-col gap-5">
            <div className="w-fit rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/85">
              {roleLabel(user.role)}
            </div>
            <div>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                {isStaff ? "Care staff dashboard" : "My health record"}
              </h1>
              <p className="mt-5 max-w-[500px] text-base leading-7 text-primary-foreground/82 md:text-lg">
                Signed in as {roleLabel(user.role)}. Access to journal features is based on your
                authenticated role.
              </p>
            </div>
          </div>

          <div className="relative min-h-56 overflow-hidden rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 shadow-xl md:hidden">
            <Image
              src="/images/doctors.jpg"
              alt=""
              fill
              className="object-cover"
              priority
              sizes="(min-width: 768px) 420px, 100vw"
            />
            <div className="absolute inset-0 bg-primary/10" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 p-4 md:grid-cols-3 md:p-6">
        {isStaff ? (
          <Card>
            <CardHeader>
              <SearchIcon className="size-5 text-muted-foreground" aria-hidden="true" />
              <CardTitle>Patient search</CardTitle>
              <CardDescription>
                Search by patient name once the patient API is ready.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/patients">Open patient search</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <FileTextIcon className="size-5 text-muted-foreground" aria-hidden="true" />
              <CardTitle>Own journal</CardTitle>
              <CardDescription>Patients go directly to their own journal view.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <Button asChild>
                <Link href={ownPatientId ? `/patients/${ownPatientId}` : "/patients"}>
                  Open my journal
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <ActivityIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Access logs</CardTitle>
            <CardDescription>
              Every journal access should appear in the blockchain-backed log.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Waiting for task 15.</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <ShieldCheckIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Verification</CardTitle>
            <CardDescription>
              Verification badge placeholder for the blockchain audit state.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No chain data loaded yet.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
