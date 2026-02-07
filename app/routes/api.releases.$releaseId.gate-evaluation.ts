import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { ReleaseLayer } from "~/features/release-gate/infrastructure/layers/release-layer";
import { evaluateGate } from "~/features/release-gate/application/usecases/evaluate-gate";
import { approveRelease } from "~/features/release-gate/application/usecases/approve-release";

/**
 * POST /api/releases/:releaseId/gate-evaluation
 *
 * リリースのゲート条件を評価
 * actionパラメータによって評価のみまたは承認まで実行
 */
export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const { releaseId } = params;

    if (!releaseId) {
      return data({ error: "releaseId is required" }, { status: 400 });
    }

    const body = await request.json();
    const actionType = body.action as "evaluate" | "approve" | undefined;
    const approverId = body.approverId as string | undefined;
    const comment = body.comment as string | undefined;

    // 評価のみ実行
    if (actionType === "evaluate" || !actionType) {
      const program = evaluateGate({
        releaseId,
      }).pipe(Effect.provide(ReleaseLayer));

      const evaluation = await Effect.runPromise(program);

      return data({
        data: evaluation,
        message: evaluation.passed
          ? "全てのゲート条件を満たしています"
          : "ゲート条件違反が検出されました",
      });
    }

    // 承認まで実行
    if (actionType === "approve") {
      if (!approverId) {
        return data(
          { error: "approverId is required for approval" },
          { status: 400 },
        );
      }

      const program = approveRelease({
        releaseId,
        approverId,
        comment,
      }).pipe(Effect.provide(ReleaseLayer));

      const result = await Effect.runPromise(program);

      return data(
        {
          data: result,
          message: "リリースを承認しました",
        },
        { status: 200 },
      );
    }

    return data({ error: "Invalid action type" }, { status: 400 });
  } catch (error) {
    console.error("Failed to evaluate/approve release:", error);
    return data(
      {
        error: "Failed to process gate evaluation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
