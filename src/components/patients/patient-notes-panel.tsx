"use client";

import { useState } from "react";
import { InfoIcon, NotebookPenIcon } from "lucide-react";

import { roleLabel } from "@/components/auth/mock-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isStaffRole } from "@/lib/patients/mock-patients";
import type { JournalNotePreview, NoteVisibility, PatientJournalResponse } from "@/lib/types/api";

const VISIBILITY_OPTIONS: Array<{
  value: NoteVisibility;
  label: string;
  description: string;
}> = [
  {
    value: "private",
    label: "Private",
    description: "Only visible to the author",
  },
  {
    value: "healthcare",
    label: "Healthcare",
    description: "Visible to doctors, nurses, and ambulance staff",
  },
  {
    value: "all",
    label: "All",
    description: "Visible to staff and the patient",
  },
];

const MAX_NOTE_LENGTH = 1000;

export function PatientNotesPanel({
  journal,
  onCreateNote,
}: {
  journal: PatientJournalResponse;
  onCreateNote: (note: JournalNotePreview) => void;
}) {
  const canCreateNote = isStaffRole(journal.viewerRole);
  const [noteText, setNoteText] = useState("");
  const [visibility, setVisibility] = useState<NoteVisibility>("healthcare");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedText = noteText.trim();
    if (!trimmedText) {
      setFormError("Write a note before saving.");
      return;
    }

    if (trimmedText.length > MAX_NOTE_LENGTH) {
      setFormError(`Notes can be at most ${MAX_NOTE_LENGTH} characters.`);
      return;
    }

    onCreateNote({
      id: Date.now(),
      createdAt: formatNow(),
      author: roleLabel(journal.viewerRole),
      visibility,
      text: trimmedText,
    });

    setNoteText("");
    setVisibility("healthcare");
    setFormError(null);
  }

  return (
    <div className="grid gap-4">
      {canCreateNote ? (
        <Card>
          <CardHeader>
            <NotebookPenIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Add note</CardTitle>
            <CardDescription>
              Choose who should be able to read this note. Backend persistence lands later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="note-content">Note content</Label>
                <Textarea
                  id="note-content"
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  maxLength={MAX_NOTE_LENGTH}
                  placeholder="Write a note for this patient..."
                  className="min-h-28 resize-y"
                />
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>
                    {formError ?? "Mock note is added locally until the notes API is ready."}
                  </span>
                  <span>
                    {noteText.length}/{MAX_NOTE_LENGTH}
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="note-visibility">Visibility</Label>
                <Select
                  value={visibility}
                  onValueChange={(value) => setVisibility(value as NoteVisibility)}
                >
                  <SelectTrigger id="note-visibility" className="h-10 w-full md:max-w-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.description}
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNoteText("");
                    setVisibility("healthcare");
                    setFormError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Save note</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{journal.isOwnJournal ? "My notes" : "Notes"}</CardTitle>
          <CardDescription>
            {canCreateNote
              ? "Visibility labels show who can read each note."
              : "Only notes marked for everyone are visible to patients."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {journal.notes.length > 0 ? (
            journal.notes.map((note) => <NoteCard key={note.id} note={note} />)
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No visible notes yet.
            </div>
          )}

          {journal.hiddenNotesCount > 0 ? (
            <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {journal.hiddenNotesCount} protected note
                {journal.hiddenNotesCount === 1 ? "" : "s"} exist but are hidden for this role.
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function NoteCard({ note }: { note: JournalNotePreview }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={note.visibility === "all" ? "secondary" : "outline"}>
          {visibilityLabel(note.visibility)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {note.author} - {note.createdAt}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{note.text}</p>
    </div>
  );
}

function visibilityLabel(visibility: NoteVisibility): string {
  const labels: Record<NoteVisibility, string> = {
    private: "Private",
    healthcare: "Healthcare",
    all: "All",
  };
  return labels[visibility];
}

function formatNow(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  return `${date} ${time}`;
}
