"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ActivityIcon, FileTextIcon, LockIcon, NotebookPenIcon } from "lucide-react";

import { getMockSession } from "@/components/auth/mock-auth";
import { AppHeader } from "@/components/common/app-header";
import { RoleBadge } from "@/components/common/role-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SessionUser } from "@/lib/types/api";

const staffRoles = new Set(["doctor", "nurse", "ambulance"]);

const patientNames: Record<string, string> = {
  "1": "Anna Andersson",
  "2": "Erik Eriksson",
  "3": "Sara Nilsson",
};

export default function PatientJournalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [user] = useState<SessionUser | null>(() => getMockSession());
  const patientName = patientNames[params.id] ?? "Unknown patient";

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

  if (!user || !staffRoles.has(user.role)) {
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
      <section className="border-b bg-muted/30 px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
          <RoleBadge role={user.role} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{patientName}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Journal placeholder for patient #{params.id}. This view will connect to SQL records,
              note visibility, and blockchain access logs in later tasks.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:p-6">
        <div>
          <Button asChild variant="outline">
            <Link href="/patients">Back to search</Link>
          </Button>
        </div>

        <Tabs defaultValue="records">
          <TabsList>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="access">Access log</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="mt-4">
            <Card>
              <CardHeader>
                <FileTextIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                <CardTitle>Medical records</CardTitle>
                <CardDescription>
                  Mock placeholder. Real medical records will be read from SQL.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Annual checkup, blood pressure follow-up, and care plan summaries go here.</p>
                <p>No medical data is stored on the blockchain.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardHeader>
                <NotebookPenIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                <CardTitle>Notes</CardTitle>
                <CardDescription>
                  Visibility selector and note form will be added in the notes task.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-start gap-3 text-sm text-muted-foreground">
                <LockIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Private, healthcare-only, and all-users notes will be filtered server-side.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="mt-4">
            <Card>
              <CardHeader>
                <ActivityIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                <CardTitle>Access log</CardTitle>
                <CardDescription>
                  Blockchain verification state will appear here once audit logging is ready.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Waiting for access-log data from task 15.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
