"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ActivityIcon,
  CheckCircle2Icon,
  FileTextIcon,
  LockIcon,
  NotebookPenIcon,
} from "lucide-react";

import { mockSessionHeaders } from "@/components/auth/mock-auth";
import { RoleBadge } from "@/components/common/role-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api/client";
import type { PatientJournalResponse, SessionUser } from "@/lib/types/api";

export function PatientJournal({ patientId, user }: { patientId: string; user: SessionUser }) {
  const [journal, setJournal] = useState<PatientJournalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadJournal() {
      try {
        const data = await apiRequest<PatientJournalResponse>(`/api/patients/${patientId}`, {
          headers: mockSessionHeaders(user),
        });
        if (isMounted) {
          setJournal(data);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError("You are not allowed to open this patient journal.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadJournal();

    return () => {
      isMounted = false;
    };
  }, [patientId, user]);

  if (isLoading) {
    return (
      <section className="mx-auto grid w-full max-w-6xl gap-4 p-4 md:grid-cols-2 md:p-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </section>
    );
  }

  if (error || !journal) {
    return (
      <section className="mx-auto w-full max-w-6xl p-4 md:p-6">
        <Card>
          <CardHeader>
            <LockIcon className="size-5 text-destructive" aria-hidden="true" />
            <CardTitle>Access denied</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const title = journal.isOwnJournal ? "My health record" : journal.patient.name;

  return (
    <>
      <section className="border-b bg-muted/30 px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
          <RoleBadge role={journal.viewerRole} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              DOB {journal.patient.dateOfBirth} - {journal.patient.personalNumber}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:p-6">
        {!journal.isOwnJournal ? (
          <div>
            <Button asChild variant="outline">
              <Link href="/patients">Back to search</Link>
            </Button>
          </div>
        ) : null}

        <Tabs defaultValue="records">
          <TabsList className="flex-wrap">
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
                  Medical information is loaded from SQL in the final flow.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {journal.records.map((record) => (
                  <div key={record.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium">{record.title}</h2>
                      <Badge variant="outline">{record.date}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{record.summary}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{record.practitioner}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardHeader>
                <NotebookPenIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                <CardTitle>Notes</CardTitle>
                <CardDescription>
                  Patients only see notes marked for everyone. Staff can see healthcare notes.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {journal.notes.map((note) => (
                  <div key={note.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={note.visibility === "all" ? "secondary" : "outline"}>
                        {note.visibility}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {note.author} - {note.createdAt}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{note.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="mt-4">
            <Card>
              <CardHeader>
                <ActivityIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                <CardTitle>Access log</CardTitle>
                <CardDescription>
                  Mock blockchain verification status until task 15 connects the audit chain.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {journal.accessLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium">{log.actorName}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.action.replace("_", " ")} as {log.actorRole} - {log.timestamp}
                      </p>
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      <CheckCircle2Icon className="size-3" aria-hidden="true" />
                      {log.verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
