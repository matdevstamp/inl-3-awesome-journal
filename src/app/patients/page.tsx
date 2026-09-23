"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { useMockSession } from "@/components/auth/mock-auth";
import { AppHeader } from "@/components/common/app-header";
import { RoleBadge } from "@/components/common/role-badge";
import { PatientSearch } from "@/components/patients/patient-search";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isStaffRole, patientIdForUser } from "@/lib/patients/mock-patients";

export default function PatientsPage() {
  const router = useRouter();
  const user = useMockSession();

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
      return;
    }

    if (user.role === "patient") {
      const patientId = patientIdForUser(user);
      router.push(patientId ? `/patients/${patientId}` : "/dashboard");
    }
  }, [router, user]);

  if (user === undefined || user === null || !isStaffRole(user.role)) {
    return (
      <main className="flex flex-1 flex-col">
        <AppHeader />
        <section className="mx-auto grid w-full max-w-6xl gap-4 p-4 md:grid-cols-2 md:p-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
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
      <section className="relative z-10 border-b bg-background px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
          <RoleBadge role={user.role} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Patient search</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Search fictional patient records through the patient API while SQL integration is
              being finished.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="w-fit rounded-lg shadow-sm">
          <Button
            asChild
            variant="ghost"
            className="border-2 bg-background hover:bg-red-900 hover:text-white"
          >
            <Link href="/dashboard">
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              Back to dashboard
            </Link>
          </Button>
        </div>
        <PatientSearch />
      </section>
    </main>
  );
}
