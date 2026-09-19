import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { PatientSearchFilter } from "@/lib/types/api";

const PAGE_SIZE = 3;

export async function searchDatabasePatients(
  query: string,
  filters: PatientSearchFilter[],
  requestedPage: number,
  viewerId: number,
) {
  const conditions: Prisma.PatientWhereInput[] = [];
  if (filters.includes("name")) {
    conditions.push({
      AND: query
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => ({
          OR: [
            { firstName: { contains: word, mode: "insensitive" } },
            { lastName: { contains: word, mode: "insensitive" } },
          ],
        })),
    });
  }
  if (filters.includes("personalNumber")) {
    const digits = query.replace(/[\s-]/g, "");
    if (/^\d+$/.test(digits)) conditions.push({ personalNumber: { contains: digits } });
  }
  if (filters.includes("dob")) {
    const range = dateRange(query);
    if (range) conditions.push({ dateOfBirth: range });
  }
  const where: Prisma.PatientWhereInput = !query
    ? {}
    : {
        OR: conditions.length ? conditions : [{ id: -1 }],
      };

  return prisma.$transaction(async (db) => {
    const total = await db.patient.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(requestedPage, totalPages);
    const patients = await db.patient.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        personalNumber: true,
        records: {
          select: {
            createdAt: true,
            _count: {
              select: {
                notes: {
                  where: {
                    OR: [{ visibility: { in: ["all", "healthcare"] } }, { authorId: viewerId }],
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return {
      patients: patients.map((patient) => ({
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        dateOfBirth: patient.dateOfBirth.toISOString().slice(0, 10),
        personalNumber: patient.personalNumber,
        recordCount: patient.records.length,
        noteCount: patient.records.reduce((count, record) => count + record._count.notes, 0),
        lastVisit: patient.records[0]?.createdAt.toISOString().slice(0, 10) ?? "-",
      })),
      total,
      totalPages,
      page,
      pageSize: PAGE_SIZE,
    };
  });
}

// A date prefix matches a whole year, month, or day without casting SQL dates to text.
function dateRange(query: string): { gte: Date; lt: Date } | null {
  if (!/^\d{4}(-\d{2})?(-\d{2})?$/.test(query)) return null;
  const parts = query.split("-").map(Number);
  const [year = 0, month = 1, day = 1] = parts;
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const start = new Date(Date.UTC(year, month - 1, day));
  if (start.getUTCMonth() !== month - 1 || start.getUTCDate() !== day) return null;
  const end = new Date(start);
  if (parts.length === 1) end.setUTCFullYear(year + 1);
  else if (parts.length === 2) end.setUTCMonth(month);
  else end.setUTCDate(day + 1);
  return { gte: start, lt: end };
}
