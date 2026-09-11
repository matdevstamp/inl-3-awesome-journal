import type {
  AccessLogPreview,
  JournalNotePreview,
  MedicalRecordPreview,
  NoteVisibility,
  PatientSearchFilter,
  PatientSummary,
  Role,
  SessionUser,
} from "@/lib/types/api";

export const STAFF_ROLES = ["doctor", "nurse", "ambulance"] as const;

export const DEFAULT_PATIENT_FILTERS: PatientSearchFilter[] = ["name"];

export const PATIENT_PAGE_SIZE = 3;

const USER_PATIENT_IDS: Record<number, number> = {
  4: 1,
};

export const MOCK_PATIENTS: PatientSummary[] = [
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
  {
    id: 4,
    name: "Oskar Bergstrom",
    dateOfBirth: "1969-02-10",
    personalNumber: "19690210-1357",
    recordCount: 4,
    noteCount: 2,
    lastVisit: "2026-07-12",
  },
];

const RECORDS: Record<number, MedicalRecordPreview[]> = {
  1: [
    {
      id: 101,
      date: "2026-08-18",
      title: "Annual checkup",
      practitioner: "Dr. Sofia Berg",
      summary: "Blood pressure follow-up and updated care plan.",
    },
    {
      id: 102,
      date: "2026-05-03",
      title: "Lab result review",
      practitioner: "Nurse Alex Lind",
      summary: "Routine lab values reviewed with no urgent action.",
    },
  ],
  2: [
    {
      id: 201,
      date: "2026-08-30",
      title: "Follow-up appointment",
      practitioner: "Dr. Sofia Berg",
      summary: "Medication effect reviewed and next check booked.",
    },
  ],
  3: [
    {
      id: 301,
      date: "2026-09-01",
      title: "Care plan update",
      practitioner: "Ambulance Unit A",
      summary: "Emergency contact details and allergy warnings confirmed.",
    },
  ],
  4: [
    {
      id: 401,
      date: "2026-07-12",
      title: "Referral review",
      practitioner: "Dr. Sofia Berg",
      summary: "Referral status reviewed with patient.",
    },
  ],
};

const NOTES: Record<number, JournalNotePreview[]> = {
  1: [
    {
      id: 1001,
      createdAt: "2026-08-18 10:42",
      author: "Dr. Sofia Berg",
      visibility: "all",
      text: "Patient informed about follow-up and agrees with the care plan.",
    },
    {
      id: 1002,
      createdAt: "2026-08-18 10:48",
      author: "Dr. Sofia Berg",
      visibility: "healthcare",
      text: "Healthcare staff should monitor blood pressure trend at next visit.",
    },
    {
      id: 1003,
      createdAt: "2026-08-18 10:51",
      author: "Dr. Sofia Berg",
      visibility: "private",
      text: "Private reminder to compare previous medication history.",
    },
  ],
  2: [
    {
      id: 2001,
      createdAt: "2026-08-30 14:10",
      author: "Nurse Alex Lind",
      visibility: "all",
      text: "Patient received written instructions for next appointment.",
    },
  ],
  3: [
    {
      id: 3001,
      createdAt: "2026-09-01 08:15",
      author: "Ambulance Unit A",
      visibility: "healthcare",
      text: "Ambulance team confirmed allergy information during transport.",
    },
  ],
  4: [
    {
      id: 4001,
      createdAt: "2026-07-12 09:05",
      author: "Dr. Sofia Berg",
      visibility: "all",
      text: "Patient has received referral information.",
    },
  ],
};

const ACCESS_LOGS: Record<number, AccessLogPreview[]> = {
  1: [
    {
      id: 5001,
      timestamp: "2026-09-10 09:30",
      actorName: "Dr. Sofia Berg",
      actorRole: "doctor",
      action: "viewed",
      verified: true,
    },
    {
      id: 5002,
      timestamp: "2026-09-10 09:35",
      actorName: "Nurse Alex Lind",
      actorRole: "nurse",
      action: "created_note",
      verified: true,
    },
  ],
  2: [
    {
      id: 6001,
      timestamp: "2026-09-09 13:02",
      actorName: "Dr. Sofia Berg",
      actorRole: "doctor",
      action: "viewed",
      verified: true,
    },
  ],
  3: [
    {
      id: 7001,
      timestamp: "2026-09-11 08:40",
      actorName: "Ambulance Unit A",
      actorRole: "ambulance",
      action: "viewed",
      verified: true,
    },
  ],
  4: [
    {
      id: 8001,
      timestamp: "2026-09-01 15:20",
      actorName: "Dr. Sofia Berg",
      actorRole: "doctor",
      action: "updated_record",
      verified: true,
    },
  ],
};

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number]);
}

export function patientIdForUser(user: SessionUser): number | null {
  return USER_PATIENT_IDS[user.id] ?? null;
}

export function findPatient(patientId: number): PatientSummary | null {
  return MOCK_PATIENTS.find((patient) => patient.id === patientId) ?? null;
}

export function searchPatients(
  query: string,
  filters: PatientSearchFilter[],
  page: number,
  pageSize = PATIENT_PAGE_SIZE,
) {
  const normalizedQuery = normalize(query);
  const activeFilters = filters.length > 0 ? filters : DEFAULT_PATIENT_FILTERS;
  const matches = MOCK_PATIENTS.filter((patient) => {
    if (!normalizedQuery) {
      return true;
    }

    return activeFilters.some((filter) => {
      if (filter === "name") {
        return normalize(patient.name).includes(normalizedQuery);
      }
      if (filter === "dob") {
        return patient.dateOfBirth.includes(normalizedQuery);
      }
      return patient.personalNumber.includes(normalizedQuery);
    });
  });

  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    patients: matches.slice(start, start + pageSize),
    page: currentPage,
    pageSize,
    total: matches.length,
    totalPages,
  };
}

export function getJournalForPatient(patientId: number, viewerRole: Role) {
  const notes = NOTES[patientId] ?? [];

  return {
    records: RECORDS[patientId] ?? [],
    notes: filterNotesForRole(notes, viewerRole),
    accessLogs: ACCESS_LOGS[patientId] ?? [],
  };
}

function filterNotesForRole(notes: JournalNotePreview[], viewerRole: Role) {
  if (viewerRole === "patient") {
    return notes.filter((note) => note.visibility === "all");
  }

  if (isStaffRole(viewerRole)) {
    const visibleToStaff = new Set<NoteVisibility>(["all", "healthcare", "private"]);
    return notes.filter((note) => visibleToStaff.has(note.visibility));
  }

  return [];
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("sv-SE");
}
