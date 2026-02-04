// warning
// We recommend using a connection pooler (like Prisma Accelerate) to manage database connections efficiently.
// If you choose not to use one, avoid instantiating PrismaClient globally in long-lived environments. Instead, 
// create and dispose of the client per request to prevent exhausting your database connections.

import { PrismaClient } from "../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
