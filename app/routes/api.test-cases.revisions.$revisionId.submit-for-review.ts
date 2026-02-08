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
 *
 * パスパラメータ:
 * - revisionId: リビジョンID
 *
 * リクエストボディ:
 * - submittedBy: 提出者のユーザーID
 *
 * @example
 * POST /api/test-cases/revisions/uuid/submit-for-review
 * ```json
 * {
 *   "submittedBy": "uuid"
 * }
 * ```
 */
export async function action({ params, request }: ActionFunctionArgs) {
  try {
    const { revisionId } = params;

    if (!revisionId) {
      return data({ error: "revisionIdは必須パラメータです" }, { status: 400 });
    }

    const body = await request.json();

    // バリデーション
    const validation = submitForReviewSchema.safeParse({
      revisionId,
      submittedBy: body.submittedBy,
    });

    if (!validation.success) {
      return data(
        {
          error: "バリデーションに失敗しました",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validatedData = validation.data;

    const program = submitForReview(
      validatedData.revisionId,
      validatedData.submittedBy,
    ).pipe(Effect.provide(TestCaseManagementLayer));

    const revision = await Effect.runPromise(program);

    return data({
      data: revision,
      message: "リビジョンがレビューに提出されました",
    });
  } catch (error) {
    console.error("Failed to submit for review:", error);
    return data(
      {
        error: "レビュー提出に失敗しました",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
