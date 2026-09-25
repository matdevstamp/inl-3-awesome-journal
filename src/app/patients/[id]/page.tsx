"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LockIcon } from "lucide-react";

import { useSession } from "@/components/auth/mock-auth";
import { AppHeader } from "@/components/common/app-header";
import { PatientJournal } from "@/components/patients/patient-journal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientJournalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const user = useSession();

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    if (user === null) {
      router.push("/login");
      return;
    }

    if (user.role === "unauthorized") {
      router.push("/access-denied");
    }
  }, [router, user]);

  if (user === undefined || user === null || user.role === "unauthorized") {
    return (
      <main className="flex flex-1 flex-col">
        <AppHeader />
        <section className="mx-auto grid w-full max-w-6xl gap-4 p-4 md:grid-cols-2 md:p-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </section>
      </main>
    );
  }

  if (user.role === "patient" && String(user.patientId) !== params.id) {
    return (
      <main className="flex flex-1 flex-col">
        <AppHeader />
        <section className="mx-auto flex w-full max-w-6xl flex-1 items-start p-4 md:p-6">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <LockIcon className="size-5 text-destructive" aria-hidden="true" />
              <h1 className="text-base leading-snug font-medium">Access denied</h1>
              <CardDescription>Patients can only open their own journal.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={user.patientId ? `/patients/${user.patientId}` : "/dashboard"}>
                  Open my journal
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-14 bottom-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.58),rgba(0,0,0,0.76)),url('/images/hospital.jpg')] bg-cover bg-center opacity-80"
        aria-hidden="true"
      />
      <div className="relative z-20 bg-background">
        <AppHeader />
      </div>
      <div className="relative z-10 flex flex-1 flex-col">
        <PatientJournal patientId={params.id} user={user} />
      </div>
    </main>
  );
}
