import { Effect, Layer } from "effect";
import { PrismaService } from "@shared/db/layers/prisma-layer";
import { TestResultRepository } from "../../application/ports/test-result-repository";
import { TestResult } from "../../domain/models/test-result";
import type { ResultStatus } from "../../domain/models/result-status";

/**
 * Prisma TestResultRepository実装
 */
export const PrismaTestResultRepository = Layer.effect(
  TestResultRepository,
  Effect.gen(function* () {
    const prisma = yield* PrismaService;

    return {
      create: (input) =>
        Effect.gen(function* () {
          const testResult = yield* Effect.tryPromise({
            try: () =>
              prisma.testResult.create({
                data: {
                  run_item_id: input.runItemId,
                  status: input.status,
                  evidence: input.evidence
                    ? (input.evidence as unknown as object)
                    : undefined,
                  bug_links: input.bugLinks
                    ? (input.bugLinks as unknown as object)
                    : undefined,
                  executed_by: input.executedBy,
                },
              }),
            catch: (error) =>
              new Error(`テスト結果の記録に失敗しました: ${String(error)}`),
          });

          return new TestResult({
            id: testResult.id,
            runItemId: testResult.run_item_id,
            status: testResult.status as ResultStatus,
            evidence: testResult.evidence
              ? (testResult.evidence as {
                  logs?: string;
                  screenshots?: readonly string[];
                  links?: readonly string[];
                })
              : undefined,
            bugLinks: testResult.bug_links
              ? (testResult.bug_links as unknown as readonly {
                  url: string;
                  title: string;
                  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
                }[])
              : undefined,
            executedBy: testResult.executed_by,
            executedAt: testResult.executed_at,
          });
        }),

      findByRunItemId: (runItemId: string) =>
        Effect.gen(function* () {
          const results = yield* Effect.tryPromise({
            try: () =>
              prisma.testResult.findMany({
                where: { run_item_id: runItemId },
                orderBy: { executed_at: "desc" },
              }),
            catch: (error) =>
              new Error(`テスト結果の取得に失敗しました: ${String(error)}`),
          });

          return results.map(
            (r) =>
              new TestResult({
                id: r.id,
                runItemId: r.run_item_id,
                status: r.status as ResultStatus,
                evidence: r.evidence
                  ? (r.evidence as {
                      logs?: string;
                      screenshots?: readonly string[];
                      links?: readonly string[];
                    })
                  : undefined,
                bugLinks: r.bug_links
                  ? (r.bug_links as unknown as readonly {
                      url: string;
                      title: string;
                      severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
                    }[])
                  : undefined,
                executedBy: r.executed_by,
                executedAt: r.executed_at,
              }),
          );
        }),

      findLatestByRunItemId: (runItemId: string) =>
        Effect.gen(function* () {
          const result = yield* Effect.tryPromise({
            try: () =>
              prisma.testResult.findFirst({
                where: { run_item_id: runItemId },
                orderBy: { executed_at: "desc" },
              }),
            catch: (error) =>
              new Error(`最新テスト結果の取得に失敗しました: ${String(error)}`),
          });

          if (!result) {
            return null;
          }

          return new TestResult({
            id: result.id,
            runItemId: result.run_item_id,
            status: result.status as ResultStatus,
            evidence: result.evidence
              ? (result.evidence as {
                  logs?: string;
                  screenshots?: readonly string[];
                  links?: readonly string[];
                })
              : undefined,
            bugLinks: result.bug_links
              ? (result.bug_links as unknown as readonly {
                  url: string;
                  title: string;
                  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
                }[])
              : undefined,
            executedBy: result.executed_by,
            executedAt: result.executed_at,
          });
        }),

      findByRunId: (runId: string) =>
        Effect.gen(function* () {
          const results = yield* Effect.tryPromise({
            try: () =>
              prisma.testResult.findMany({
                where: {
                  run_item: {
                    run_id: runId,
                  },
                },
                orderBy: { executed_at: "desc" },
              }),
            catch: (error) =>
              new Error(`テスト結果一覧の取得に失敗しました: ${String(error)}`),
          });

          return results.map(
            (r) =>
              new TestResult({
                id: r.id,
                runItemId: r.run_item_id,
                status: r.status as ResultStatus,
                evidence: r.evidence
                  ? (r.evidence as {
                      logs?: string;
                      screenshots?: readonly string[];
                      links?: readonly string[];
                    })
                  : undefined,
                bugLinks: r.bug_links
                  ? (r.bug_links as unknown as readonly {
                      url: string;
                      title: string;
                      severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
                    }[])
                  : undefined,
                executedBy: r.executed_by,
                executedAt: r.executed_at,
              }),
          );
        }),
    };
  }),
);
