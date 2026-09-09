"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchIcon, UserRoundIcon } from "lucide-react";

import { getMockSession } from "@/components/auth/mock-auth";
import { AppHeader } from "@/components/common/app-header";
import { RoleBadge } from "@/components/common/role-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionUser } from "@/lib/types/api";

type MockPatient = {
  id: number;
  name: string;
  dateOfBirth: string;
  personalNumber: string;
  recordCount: number;
  noteCount: number;
  lastVisit: string;
};

const mockPatients: MockPatient[] = [
  {
    id: 1,
    name: "Anna Andersson",
    dateOfBirth: "1985-03-15",
    personalNumber: "19850315-1234",
    recordCount: 5,
    noteCount: 3,
    lastVisit: "2026-08-18",
  },
  {
    id: 2,
    name: "Erik Eriksson",
    dateOfBirth: "1992-07-22",
    personalNumber: "19920722-5678",
    recordCount: 2,
    noteCount: 1,
    lastVisit: "2026-08-30",
  },
  {
    id: 3,
    name: "Sara Nilsson",
    dateOfBirth: "1978-11-04",
    personalNumber: "19781104-2468",
    recordCount: 7,
    noteCount: 4,
    lastVisit: "2026-09-01",
  },
];

const staffRoles = new Set(["doctor", "nurse", "ambulance"]);

export default function PatientsPage() {
  const router = useRouter();
  const [user] = useState<SessionUser | null>(() => getMockSession());
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role === "unauthorized") {
      router.push("/access-denied");
      return;
    }

    if (!staffRoles.has(user.role)) {
      router.push("/dashboard");
    }
  }, [router, user]);

  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return mockPatients;
    }

    return mockPatients.filter((patient) => {
      return (
        patient.name.toLowerCase().includes(normalizedQuery) ||
        patient.personalNumber.includes(normalizedQuery)
      );
    });
  }, [query]);

  if (!user || !staffRoles.has(user.role)) {
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
              Search fictional patient records by name or personal number while the backend patient
              API is being finished.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Find patient</CardTitle>
            <CardDescription>
              Mock data only. Medical records still belong in SQL, never on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or personal number"
                className="pl-9"
                autoComplete="off"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <Card key={patient.id}>
                <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <UserRoundIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-medium">{patient.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        DOB {patient.dateOfBirth} - {patient.personalNumber}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">{patient.recordCount} records</Badge>
                        <Badge variant="secondary">{patient.noteCount} notes</Badge>
                        <Badge variant="outline">Last visit {patient.lastVisit}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/patients/${patient.id}`}>Open journal</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <h2 className="font-medium">No patients found</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try another fictional name, for example Anna, Erik, or Sara.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
