import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { TestExecutionLayer } from "~/features/test-execution/infrastructure/layers/test-execution-layer";
import { recordTestResult } from "~/features/test-execution/application/usecases/record-test-result";
import { recordTestResultSchema } from "~/lib/schemas/test-result";

/**
 * POST /api/test-runs/:runId/items/:itemId/results
 *
 * テスト結果を記録
 */
export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const { runId, itemId } = params;

    if (!runId || !itemId) {
      return data(
        { error: "runId and itemId are required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // バリデーション
    const validation = recordTestResultSchema.safeParse({
      ...body,
      runId,
      runItemId: itemId,
    });

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

    const program = recordTestResult({
      runId: validatedData.runId,
      runItemId: validatedData.runItemId,
      status: validatedData.status,
      evidence: validatedData.evidence,
      bugLinks: validatedData.bugLinks,
      executedBy: validatedData.executedBy,
    }).pipe(Effect.provide(TestExecutionLayer));

    const result = await Effect.runPromise(program);

    return data(
      {
        data: result,
        message: "テスト結果を記録しました",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to record test result:", error);
    return data(
      {
        error: "Failed to record test result",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
