import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect, Layer } from "effect";
import { TestExecutionLayer } from "~/features/test-execution/infrastructure/layers/test-execution-layer";
import { createTestRun } from "~/features/test-execution/application/usecases/create-test-run";
import { TestRunRepository } from "~/features/test-execution/application/ports/test-run-repository";
import { TestResultRepository } from "~/features/test-execution/application/ports/test-result-repository";
import { z } from "zod";

/**
 * テストラン作成スキーマ（簡易版）
 */
const createTestRunSchema = z.object({
  runGroupId: z.string().uuid(),
  assigneeUserId: z.string().uuid(),
  sourceListRevisionId: z.string().uuid(),
  buildRef: z.string().optional(),
});

/**
 * GET /api/test-runs
 *
 * テストラン一覧を取得
 * クエリパラメータ: runGroupId (オプション)
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const runGroupId = url.searchParams.get("runGroupId");

    const program = Effect.gen(function* () {
      const testRunRepo = yield* TestRunRepository;
      const testResultRepo = yield* TestResultRepository;

      // runGroupIdが指定されていればフィルタ、なければ全取得は実装なし
      // 現在はrunGroupIdが必須
      if (!runGroupId) {
        return [];
      }

      const runs = yield* testRunRepo.findByRunGroupId(runGroupId);

      // 各ランの進捗情報を取得
      const runsWithProgress = yield* Effect.forEach(runs, (run) =>
        Effect.gen(function* () {
          const { items } = yield* testRunRepo.findByIdWithItems(run.id);
          const results = yield* testResultRepo.findByRunId(run.id);

          const executed = new Set(results.map((r) => r.runItemId)).size;
          const passed = results.filter((r) => r.status === "PASS").length;
          const failed = results.filter((r) => r.status === "FAIL").length;

          return {
            id: run.id,
            runGroupId: run.runGroupId,
            assigneeUserId: run.assigneeUserId,
            sourceListRevisionId: run.sourceListRevisionId,
            buildRef: run.buildRef,
            status: run.status,
            createdAt: run.createdAt,
            updatedAt: run.updatedAt,
            progress: {
              total: items.length,
              executed,
              passed,
              failed,
            },
          };
        }),
      );

      return runsWithProgress;
    }).pipe(Effect.provide(TestExecutionLayer));

    const result = await Effect.runPromise(program);

    return data({ data: result }, { status: 200 });
  } catch (error) {
    console.error("Failed to load test runs:", error);
    return data(
      {
        error: "Failed to load test runs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/test-runs
 *
 * 新しいテストランを作成
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = createTestRunSchema.safeParse(body);
    if (!validation.success) {
      return data(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validatedData = validation.data;

    const program = createTestRun({
      runGroupId: validatedData.runGroupId,
      assigneeUserId: validatedData.assigneeUserId,
      sourceListRevisionId: validatedData.sourceListRevisionId,
      buildRef: validatedData.buildRef,
    }).pipe(Effect.provide(TestExecutionLayer));

    const result = await Effect.runPromise(program);

    return data(
      {
        data: {
          run: result.run,
          items: result.items,
          itemCount: result.items.length,
        },
        message: `テストランを作成しました（${result.items.length}件のテストケース）`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create test run:", error);
    return data(
      {
        error: "Failed to create test run",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
