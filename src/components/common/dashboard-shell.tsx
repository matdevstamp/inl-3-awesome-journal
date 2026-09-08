"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ActivityIcon, FileTextIcon, SearchIcon, ShieldCheckIcon } from "lucide-react";

import { getMockSession, roleLabel } from "@/components/auth/mock-auth";
import { AppHeader } from "@/components/common/app-header";
import { RoleBadge } from "@/components/common/role-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionUser } from "@/lib/types/api";

const staffRoles = new Set(["doctor", "nurse", "ambulance"]);

export function DashboardShell() {
  const router = useRouter();
  const [user] = useState<SessionUser | null>(() => getMockSession());

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

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />
      <section className="border-b bg-muted/30 px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
          <RoleBadge role={user.role} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {isStaff ? "Care staff dashboard" : "My health record"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Signed in as {roleLabel(user.role)}. This mock dashboard lets the frontend move while
              backend authentication and patient data are being finished.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 p-4 md:grid-cols-3 md:p-6">
        {isStaff ? (
          <Card>
            <CardHeader>
              <SearchIcon className="size-5 text-muted-foreground" aria-hidden="true" />
              <CardTitle>Patient search</CardTitle>
              <CardDescription>Search by patient name once the patient API is ready.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Planned route: /patients
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
              Planned route: /patients/me
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <ActivityIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Access logs</CardTitle>
            <CardDescription>Every journal access should appear in the blockchain-backed log.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Waiting for task 15.</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <ShieldCheckIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Verification</CardTitle>
            <CardDescription>Verification badge placeholder for the blockchain audit state.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No chain data loaded yet.</CardContent>
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
