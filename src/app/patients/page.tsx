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
    if (!user) {
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

  if (!user || !isStaffRole(user.role)) {
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
    <main className="flex flex-1 flex-col">
      <AppHeader />
      <section className="border-b bg-muted/30 px-4 py-6 md:px-6">
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

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:p-6">
        <div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              Back to dashboard
            </Link>
          </Button>
        </div>
        <PatientSearch user={user} />
      </section>
    </main>
  );
}
