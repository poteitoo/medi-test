import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { TestCaseManagementLayer } from "~/features/test-case-management/infrastructure/layers/test-case-layer";
import { submitForReview } from "~/features/test-case-management/application/usecases/submit-for-review";
import { submitForReviewSchema } from "~/lib/schemas/test-case";

/**
 * POST /api/test-cases/revisions/:revisionId/submit-for-review
 *
 * リビジョンをレビューに提出
 */
export async function action({ params }: ActionFunctionArgs) {
  try {
    const { revisionId } = params;

    if (!revisionId) {
      return data({ error: "revisionId is required" }, { status: 400 });
    }

    // バリデーション
    const validation = submitForReviewSchema.safeParse({ revisionId });

    if (!validation.success) {
      return data(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const program = submitForReview({ revisionId }).pipe(
      Effect.provide(TestCaseManagementLayer),
    );

    const revision = await Effect.runPromise(program);

    return data({
      data: revision,
      message: "Revision submitted for review successfully",
    });
  } catch (error) {
    console.error("Failed to submit for review:", error);
    return data(
      {
        error: "Failed to submit for review",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
