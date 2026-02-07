// warning
// We recommend using a connection pooler (like Prisma Accelerate) to manage database connections efficiently.
// If you choose not to use one, avoid instantiating PrismaClient globally in long-lived environments. Instead,
// create and dispose of the client per request to prevent exhausting your database connections.

import { prisma } from "../../shared/db/client";

export function createPrismaClient() {
  return prisma;
}
