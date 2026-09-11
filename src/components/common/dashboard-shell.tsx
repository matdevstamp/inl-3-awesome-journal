"use client";

import { useEffect, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActivityIcon, FileTextIcon, SearchIcon, ShieldCheckIcon } from "lucide-react";

import { roleLabel, useMockSession } from "@/components/auth/mock-auth";
import { AppHeader } from "@/components/common/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { patientIdForUser } from "@/lib/patients/mock-patients";

const staffRoles = new Set(["doctor", "nurse", "ambulance"]);

export function DashboardShell() {
  const router = useRouter();
  const user = useMockSession();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role === "unauthorized") {
      router.push("/access-denied");
    }
  }, [router, user]);

  if (!user) {
    return (
      <DashboardLoading>
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </DashboardLoading>
    );
  }

  if (user.role === "unauthorized") {
    return (
      <DashboardLoading>
        <Skeleton className="h-32 md:col-span-3" />
      </DashboardLoading>
    );
  }

  const isStaff = staffRoles.has(user.role);
  const ownPatientId = patientIdForUser(user);

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />
      <section className="relative overflow-hidden border-b bg-primary px-4 py-10 text-primary-foreground md:min-h-[360px] md:px-6 md:py-14">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.16),transparent_48%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[52%] overflow-hidden [clip-path:ellipse(86%_82%_at_78%_50%)] md:block">
          <Image
            src="/images/doctors.jpg"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="52vw"
          />
          <div className="absolute inset-0 bg-primary/20" />
        </div>
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 md:min-h-[250px] md:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.6fr)]">
          <div className="z-10 flex flex-col gap-5">
            <div className="w-fit rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/85">
              {roleLabel(user.role)}
            </div>
            <div>
              <h1 className="max-w-xl text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                {isStaff ? "Care staff dashboard" : "My health record"}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-primary-foreground/82 md:text-lg">
                Signed in as {roleLabel(user.role)}. This mock dashboard lets the frontend move
                while backend authentication and patient data are being finished.
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

function DashboardLoading({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />
      <section className="grid gap-4 p-4 md:grid-cols-3 md:p-6">{children}</section>
    </main>
  );
}
