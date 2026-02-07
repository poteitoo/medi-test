import { PrismaClient } from "@prisma/client";

/**
 * グローバル Prisma Client インスタンス管理
 *
 * 開発環境でのホットリロード時に複数のインスタンスが作成されるのを防ぐ
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client シングルトンインスタンス
 *
 * 本番環境では新しいインスタンスを作成し、
 * 開発環境ではグローバルインスタンスを再利用する
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// 開発環境ではグローバルインスタンスとして保存
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * データベース接続を切断
 *
 * アプリケーション終了時やテスト終了時に呼び出す
 */
export const disconnect = async (): Promise<void> => {
  await prisma.$disconnect();
};
