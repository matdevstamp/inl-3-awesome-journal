import { PrismaClient } from "@prisma/client";

declare global {
  // module augmentation keeps hot reload from stacking Prisma clients
  var prisma: PrismaClient | undefined;
}

/** Shared Prisma client — reuse one connection across the whole app. */
export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
