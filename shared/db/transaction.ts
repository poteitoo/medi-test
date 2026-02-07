import { Effect } from "effect";
import type { PrismaClient } from "@prisma/client";
import { PrismaService } from "./layers/prisma-layer";

/**
 * トランザクションエラー
 */
export class TransactionError extends Error {
  readonly _tag = "TransactionError";
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

/**
 * Prisma トランザクション内で実行する処理の型
 */
export type TransactionCallback<T> = (
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
) => Promise<T>;

/**
 * Prisma トランザクションを実行するヘルパー関数
 *
 * Effect プログラム内で Prisma のトランザクションを扱いやすくする
 *
 * @param callback トランザクション内で実行する処理
 * @returns トランザクション結果の Effect
 *
 * @example
 * const program = runTransaction(async (tx) => {
 *   const user = await tx.user.create({ data: { email: "test@example.com" } });
 *   const profile = await tx.profile.create({ data: { userId: user.id } });
 *   return { user, profile };
 * });
 *
 * const result = await Effect.runPromise(
 *   program.pipe(Effect.provide(PrismaLayer))
 * );
 */
export const runTransaction = <T>(
  callback: TransactionCallback<T>,
): Effect.Effect<T, TransactionError, PrismaService> =>
  Effect.gen(function* () {
    const prisma = yield* PrismaService;

    try {
      const result = yield* Effect.tryPromise({
        try: () => prisma.$transaction(callback),
        catch: (error) =>
          new TransactionError(
            `トランザクション実行中にエラーが発生しました: ${String(error)}`,
            error,
          ),
      });

      return result;
    } catch (error) {
      return yield* Effect.fail(
        new TransactionError(
          `トランザクション実行中にエラーが発生しました: ${String(error)}`,
          error,
        ),
      );
    }
  });

/**
 * 複数の Effect を同じトランザクション内で実行する
 *
 * @param effects 実行する Effect の配列
 * @returns すべての Effect の結果を含む配列の Effect
 *
 * @example
 * const createUser = (tx: PrismaClient, email: string) =>
 *   Effect.tryPromise(() => tx.user.create({ data: { email } }));
 *
 * const createProfile = (tx: PrismaClient, userId: string) =>
 *   Effect.tryPromise(() => tx.profile.create({ data: { userId } }));
 *
 * const program = runTransactionWithEffects([
 *   (tx) => createUser(tx, "test@example.com"),
 *   (tx) => createProfile(tx, "user-id"),
 * ]);
 */
export const runTransactionWithEffects = <T>(
  effects: Array<
    (
      tx: Omit<
        PrismaClient,
        | "$connect"
        | "$disconnect"
        | "$on"
        | "$transaction"
        | "$use"
        | "$extends"
      >,
    ) => Effect.Effect<T, Error, never>
  >,
): Effect.Effect<T[], TransactionError, PrismaService> =>
  runTransaction(async (tx) => {
    const results: T[] = [];
    for (const effectFn of effects) {
      const result = await Effect.runPromise(effectFn(tx));
      results.push(result);
    }
    return results;
  });
