// warning
// We recommend using a connection pooler (like Prisma Accelerate) to manage database connections efficiently.
// If you choose not to use one, avoid instantiating PrismaClient globally in long-lived environments. Instead,
// create and dispose of the client per request to prevent exhausting your database connections.

import { PrismaClient } from "../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

export function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL,
  });

  return new PrismaClient({
    adapter,
  });
}
