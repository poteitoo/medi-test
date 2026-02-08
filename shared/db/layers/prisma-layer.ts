import { Layer, Context } from "effect";
import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@shared/db/client";

/**
 * Database Service Tag
 *
 * Effect TS のContext.Tagを使用してPrismaClientを提供
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import { Database } from "@shared/db/layers/prisma-layer";
 *
 * const program = Effect.gen(function* () {
 *   const db = yield* Database;
 *   const users = yield* Effect.tryPromise(() => db.user.findMany());
 *   return users;
 * });
 * ```
 */
export class Database extends Context.Tag("Database")<
  Database,
  PrismaClient
>() {}

/**
 * Prisma Layer (Live)
 *
 * 本番用のPrismaClient実装を提供するLayer
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const db = yield* Database;
 *   return yield* Effect.tryPromise(() => db.user.findMany());
 * }).pipe(Effect.provide(PrismaLayer));
 *
 * const result = await Effect.runPromise(program);
 * ```
 */
export const PrismaLayer = Layer.succeed(Database, getPrismaClient());

/**
 * Test用のPrisma Layer
 *
 * テスト用にモックPrismaClientを注入可能
 *
 * @param mockClient - モックPrismaClient
 * @returns Test Layer
 *
 * @example
 * ```typescript
 * const mockPrisma = {
 *   user: {
 *     findMany: vi.fn().mockResolvedValue([]),
 *   },
 * } as unknown as PrismaClient;
 *
 * const TestLayer = createTestPrismaLayer(mockPrisma);
 *
 * const program = myUseCase().pipe(Effect.provide(TestLayer));
 * await Effect.runPromise(program);
 * ```
 */
export function createTestPrismaLayer(mockClient: PrismaClient) {
  return Layer.succeed(Database, mockClient);
}
