import { Effect } from "effect";
import type { PrismaClient } from "@prisma/client";
import { Database } from "@shared/db/layers/prisma-layer";

/**
 * Prisma Transaction Utility
 *
 * Effect TSでPrismaのトランザクションを安全に扱うユーティリティ
 *
 * @remarks
 * - Prismaの`$transaction`をEffect.genでラップ
 * - エラー時は自動的にロールバック
 * - ネストしたトランザクションはサポートしない
 *
 * @example
 * ```typescript
 * import { withTransaction } from "@shared/db/transaction";
 *
 * const program = withTransaction((tx) =>
 *   Effect.gen(function* () {
 *     const user = yield* Effect.tryPromise(() =>
 *       tx.user.create({ data: { ... } })
 *     );
 *     const profile = yield* Effect.tryPromise(() =>
 *       tx.profile.create({ data: { userId: user.id, ... } })
 *     );
 *     return { user, profile };
 *   })
 * );
 * ```
 */

/**
 * トランザクションエラー
 */
export class TransactionError extends Error {
  readonly _tag = "TransactionError";
  constructor(
    readonly message: string,
    readonly cause?: Error,
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

/**
 * トランザクション内で実行する関数の型
 */
export type TransactionCallback<A, E> = (
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use"
  >,
) => Effect.Effect<A, E, never>;

/**
 * トランザクション内でEffect programを実行
 *
 * @param callback - トランザクション内で実行するEffect program
 * @returns トランザクション結果を含むEffect
 *
 * @example
 * ```typescript
 * const createUserWithProfile = withTransaction((tx) =>
 *   Effect.gen(function* () {
 *     const user = yield* Effect.tryPromise({
 *       try: () => tx.user.create({ data: { email: "test@example.com" } }),
 *       catch: (error) => new TransactionError("Failed to create user", error as Error),
 *     });
 *
 *     const profile = yield* Effect.tryPromise({
 *       try: () => tx.profile.create({ data: { userId: user.id } }),
 *       catch: (error) => new TransactionError("Failed to create profile", error as Error),
 *     });
 *
 *     return { user, profile };
 *   })
 * );
 *
 * const program = createUserWithProfile.pipe(Effect.provide(PrismaLayer));
 * const result = await Effect.runPromise(program);
 * ```
 */
export function withTransaction<A, E>(
  callback: TransactionCallback<A, E>,
): Effect.Effect<A, E | TransactionError, Database> {
  return Effect.gen(function* () {
    const prisma = yield* Database;

    return yield* Effect.tryPromise({
      try: () =>
        prisma.$transaction(async (tx) => {
          const program = callback(tx);
          return await Effect.runPromise(program);
        }),
      catch: (error) =>
        new TransactionError(
          "Transaction failed",
          error instanceof Error ? error : new Error(String(error)),
        ),
    });
  });
}

/**
 * 複数のEffect programをトランザクション内で順次実行
 *
 * @param programs - 実行するEffect programの配列
 * @returns 全ての結果を含むEffect
 *
 * @example
 * ```typescript
 * const programs = [
 *   (tx: any) => Effect.tryPromise(() => tx.user.create({ data: { ... } })),
 *   (tx: any) => Effect.tryPromise(() => tx.profile.create({ data: { ... } })),
 * ];
 *
 * const result = await Effect.runPromise(
 *   withTransactionBatch(programs).pipe(Effect.provide(PrismaLayer))
 * );
 * ```
 */
export function withTransactionBatch<A, E>(
  programs: readonly TransactionCallback<A, E>[],
): Effect.Effect<readonly A[], E | TransactionError, Database> {
  return withTransaction((tx) =>
    Effect.forEach(programs, (program) => program(tx), {
      concurrency: 1, // 順次実行
    }),
  );
}

/**
 * トランザクションのタイムアウト設定
 *
 * @param callback - トランザクション内で実行するEffect program
 * @param timeoutMs - タイムアウト時間（ミリ秒）
 * @returns タイムアウト付きのEffect
 *
 * @example
 * ```typescript
 * const program = withTransactionTimeout(
 *   (tx) => Effect.gen(function* () {
 *     // 長時間かかる処理
 *     return yield* Effect.tryPromise(() => tx.user.findMany());
 *   }),
 *   5000 // 5秒でタイムアウト
 * );
 * ```
 */
export function withTransactionTimeout<A, E>(
  callback: TransactionCallback<A, E>,
  timeoutMs: number,
): Effect.Effect<A, E | TransactionError, Database> {
  return withTransaction(callback).pipe(
    Effect.timeout(timeoutMs),
    Effect.flatMap((option) =>
      option._tag === "Some"
        ? Effect.succeed(option.value)
        : Effect.fail(
            new TransactionError(`Transaction timeout after ${timeoutMs}ms`),
          ),
    ),
  );
}
