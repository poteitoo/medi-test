import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { TestCaseManagementLayer } from "~/features/test-case-management/infrastructure/layers/test-case-layer";
import { getTestCaseRevisionHistory } from "~/features/test-case-management/application/usecases/get-revision-history";
import { createTestCaseRevision } from "~/features/test-case-management/application/usecases/create-test-case-revision";
import { TestCaseContent } from "~/features/test-case-management/domain/models/test-case-content";
import { createTestCaseRevisionSchema } from "~/lib/schemas/test-case";

/**
 * GET /api/test-cases/:caseId/revisions
 *
 * テストケースのリビジョン履歴を取得
 */
export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { caseId } = params;

    if (!caseId) {
      return data({ error: "caseId is required" }, { status: 400 });
    }

    const program = getTestCaseRevisionHistory({ caseId }).pipe(
      Effect.provide(TestCaseManagementLayer),
    );

    const revisions = await Effect.runPromise(program);

    return data({
      data: revisions,
      meta: {
        count: revisions.length,
        latest: revisions[0],
      },
    });
  } catch (error) {
    console.error("Failed to fetch revisions:", error);
    return data(
      {
        error: "Failed to fetch revisions",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/test-cases/:caseId/revisions
 *
 * 新しいリビジョンを作成
 */
export async function action({ params, request }: ActionFunctionArgs) {
  try {
    const { caseId } = params;

    if (!caseId) {
      return data({ error: "caseId is required" }, { status: 400 });
    }

    const body = await request.json();

    // バリデーション
    const validation = createTestCaseRevisionSchema.safeParse({
      ...body,
      caseId,
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
    const title = validatedData.title;
    const content = validatedData.content;
    const createdBy = validatedData.createdBy;

    const program = createTestCaseRevision({
      caseId,
      title,
      content: new TestCaseContent(content),
      createdBy,
    }).pipe(Effect.provide(TestCaseManagementLayer));

    const revision = await Effect.runPromise(program);

    return data(
      {
        data: revision,
        message: "Revision created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create revision:", error);
    return data(
      {
        error: "Failed to create revision",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
