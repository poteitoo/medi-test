import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton
 *
 * React Router v7でSSRとHMRを考慮したPrismaClient管理
 *
 * @remarks
 * - Development: グローバル変数でインスタンスを再利用（HMR対策）
 * - Production: 毎回新しいインスタンスを作成
 * - ログレベルは環境変数で制御
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma;
  }
  return createPrismaClient();
}

function createPrismaClient(): PrismaClient {
  const logLevel = getLogLevel();
  return new PrismaClient({
    log: logLevel,
    errorFormat: "pretty",
  });
}

function getLogLevel(): Array<"query" | "info" | "warn" | "error"> {
  const logEnv = process.env.PRISMA_LOG_LEVEL;
  if (logEnv === "debug") {
    return ["query", "info", "warn", "error"];
  }
  if (logEnv === "info") {
    return ["info", "warn", "error"];
  }
  if (process.env.NODE_ENV === "development") {
    return ["warn", "error"];
  }
  return ["error"];
}

export function resetPrismaClient(): void {
  if (process.env.NODE_ENV === "test") {
    globalForPrisma.prisma = undefined;
  }
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const prisma = getPrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

export const prisma = getPrismaClient();
