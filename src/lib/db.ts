import { PrismaClient } from "@prisma/client";

// Extend the global object type to include 'prisma'

declare global {
  var prisma: PrismaClient | undefined;
}
export const db = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
