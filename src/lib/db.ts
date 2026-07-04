import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton. In dev, reuse across HMR reloads to avoid
 * exhausting connections. Constructing the client does not open a connection —
 * the first query does — so importing this module is safe offline.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
