"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { useMockSession } from "@/components/auth/mock-auth";
import { AppHeader } from "@/components/common/app-header";
import { PatientJournal } from "@/components/patients/patient-journal";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientJournalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
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

  if (!user || user.role === "unauthorized") {
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

  return (
    <main className="flex flex-1 flex-col">
      <AppHeader />
      <PatientJournal patientId={params.id} user={user} />
    </main>
  );
}
