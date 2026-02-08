import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect, Layer } from "effect";
import { TestExecutionLayer } from "~/features/test-execution/infrastructure/layers/test-execution-layer";
import { TestRunRepository } from "~/features/test-execution/application/ports/test-run-repository";
import { TestResultRepository } from "~/features/test-execution/application/ports/test-result-repository";
import { Database, PrismaLayer } from "@shared/db/layers/prisma-layer";

/**
 * GET /api/test-runs/:runId
 *
 * テストラン詳細を取得（アイテムと最新結果を含む）
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { runId } = params;

  if (!runId) {
    return data({ error: "runId is required" }, { status: 400 });
  }

  try {
    const program = Effect.gen(function* () {
      const testRunRepo = yield* TestRunRepository;
      const testResultRepo = yield* TestResultRepository;
      const prisma = yield* Database;

      // テストランとアイテムを取得
      const { run, items } = yield* testRunRepo.findByIdWithItems(runId);

      // 各アイテムの最新結果を取得
      const itemsWithResults = yield* Effect.forEach(items, (item) =>
        Effect.gen(function* () {
          const latestResult = yield* testResultRepo.findLatestByRunItemId(
            item.id,
          );

          // テストケースのタイトルを取得
          const caseRevision = yield* Effect.tryPromise({
            try: () =>
              prisma.testCaseRevision.findUnique({
                where: { id: item.caseRevisionId },
                select: { title: true },
              }),
            catch: (error) =>
              new Error(`テストケースの取得に失敗しました: ${String(error)}`),
          });

          return {
            ...item,
            testCaseTitle: caseRevision?.title ?? "（タイトルなし）",
            latestResult: latestResult
              ? {
                  status: latestResult.status,
                  executedAt: latestResult.executedAt,
                  executedBy: latestResult.executedBy,
                }
              : undefined,
          };
        }),
      );

      // 進捗サマリーを計算
      const results = yield* testResultRepo.findByRunId(runId);
      const summary = {
        total: items.length,
        executed: new Set(results.map((r) => r.runItemId)).size,
        passed: results.filter((r) => r.status === "PASS").length,
        failed: results.filter((r) => r.status === "FAIL").length,
        blocked: results.filter((r) => r.status === "BLOCKED").length,
        skipped: results.filter((r) => r.status === "SKIPPED").length,
      };

      return {
        run,
        items: itemsWithResults,
        summary,
      };
    }).pipe(Effect.provide(Layer.mergeAll(TestExecutionLayer, PrismaLayer)));

    const result = await Effect.runPromise(program);

    return data({ data: result }, { status: 200 });
  } catch (error) {
    console.error("Failed to load test run:", error);
    return data(
      {
        error: "Failed to load test run",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
