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

import { getMockUserDisplayName, mockSessionHeaders } from "@/components/auth/mock-auth";
import { RoleBadge } from "@/components/common/role-badge";
import { PatientNotesPanel } from "@/components/patients/patient-notes-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api/client";
import type { JournalNotePreview, PatientJournalResponse, SessionUser } from "@/lib/types/api";
import type { BlockchainAccessLog } from "@/lib/blockchain/access-log";

export function PatientJournal({ patientId, user }: { patientId: string; user: SessionUser }) {
  const [journal, setJournal] = useState<PatientJournalResponse | null>(null);
  const [blockchainAccessLogs, setBlockchainAccessLogs] = useState<BlockchainAccessLog[]>([]);
  const [chainValid, setChainValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadJournal() {
      try {
        const data = await apiRequest<PatientJournalResponse>(`/api/patients/${patientId}`);
        const accessLogData = await apiRequest<{
          accessLogs: BlockchainAccessLog[];
          chainValid: boolean;
          viewerUserId: number;
        }>("/api/access-log", {
          headers: mockSessionHeaders(user),
        });
        if (isMounted) {
          setJournal(data);
          setBlockchainAccessLogs(accessLogData.accessLogs);
          setChainValid(accessLogData.chainValid);
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

  function handleCreateNote(note: JournalNotePreview) {
    setJournal((currentJournal) => {
      if (!currentJournal) {
        return currentJournal;
      }

      return {
        ...currentJournal,
        notes: [note, ...currentJournal.notes],
      };
    });
  }

  return (
    <>
      <section className="border-b bg-background px-4 py-6 md:px-6">
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

        <Tabs defaultValue="records" className="flex-col gap-4">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-3 bg-transparent p-0 md:grid-cols-3">
            <TabsTrigger
              value="records"
              className="h-auto justify-start gap-3 rounded-lg border bg-card p-4 text-left data-active:bg-primary data-active:text-primary-foreground"
            >
              <FileTextIcon className="size-5" aria-hidden="true" />
              <span>
                <span className="block font-medium">Records</span>
                <span className="block text-xs opacity-75">{journal.records.length} entries</span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="h-auto justify-start gap-3 rounded-lg border bg-card p-4 text-left data-active:bg-primary data-active:text-primary-foreground"
            >
              <NotebookPenIcon className="size-5" aria-hidden="true" />
              <span>
                <span className="block font-medium">Notes</span>
                <span className="block text-xs opacity-75">{journal.notes.length} visible</span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="access"
              className="h-auto justify-start gap-3 rounded-lg border bg-card p-4 text-left data-active:bg-primary data-active:text-primary-foreground"
            >
              <ActivityIcon className="size-5" aria-hidden="true" />
              <span>
                <span className="block font-medium">Access log</span>
                <span className="block text-xs opacity-75">{journal.accessLogs.length} events</span>
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="records">
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

          <TabsContent value="notes">
            <PatientNotesPanel
              authorName={getMockUserDisplayName(user)}
              journal={journal}
              onCreateNote={handleCreateNote}
            />
          </TabsContent>

          <TabsContent value="access">
            <Card>
              <CardHeader>
                <ActivityIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                <CardTitle>Access log</CardTitle>
                <CardDescription>
                  Access events recorded and verified by the blockchain audit chain.{" "}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {blockchainAccessLogs.map((log) => (
                  <div
                    key={log.eventId}
                    className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium">User {log.userId}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.action.replace("_", " ")} - {log.timestamp}
                      </p>
                      <p className="text-xs text-muted-foreground">Server: {log.serverId}</p>
                    </div>

                    <Badge variant="secondary" className="w-fit">
                      <CheckCircle2Icon className="size-3" aria-hidden="true" />
                      {chainValid ? "Blockchain verified" : "Blockchain verification failed"}
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
