import { PrismaClient } from "@prisma/client";

/**
 * Thin wrapper around Prisma for tests that need deterministic data.
 * Only used by feature specs (Gate 3+) — the smoke tests never touch the DB.
 */
export const db = new PrismaClient();
