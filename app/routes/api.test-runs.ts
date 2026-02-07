import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { TestExecutionLayer } from "~/features/test-execution/infrastructure/layers/test-execution-layer";
import { createTestRun } from "~/features/test-execution/application/usecases/create-test-run";
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
