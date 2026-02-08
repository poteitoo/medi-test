import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { TestCaseManagementLayer } from "~/features/test-case-management/infrastructure/layers/test-case-layer";
import { getTestCaseRevisionHistory } from "~/features/test-case-management/application/usecases/get-revision-history";
import { createTestCaseRevision } from "~/features/test-case-management/application/usecases/create-test-case-revision";
import {
  TestCaseContent,
  TestStep,
} from "~/features/test-case-management/domain/models/test-case-content";
import { createTestCaseRevisionSchema } from "~/lib/schemas/test-case";

/**
 * GET /api/test-cases/:caseId/revisions
 *
 * テストケースのリビジョン履歴を取得
 *
 * パスパラメータ:
 * - caseId: テストケースのstable ID
 *
 * クエリパラメータ:
 * - limit (optional): 取得する最大件数
 * - offset (optional): スキップする件数
 *
 * @example
 * GET /api/test-cases/uuid/revisions?limit=10&offset=0
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  try {
    const { caseId } = params;

    if (!caseId) {
      return data({ error: "caseIdは必須パラメータです" }, { status: 400 });
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    const options = {
      limit: limitParam ? Number(limitParam) : undefined,
      offset: offsetParam ? Number(offsetParam) : undefined,
    };

    const program = getTestCaseRevisionHistory(caseId, options).pipe(
      Effect.provide(TestCaseManagementLayer),
    );

    const revisions = await Effect.runPromise(program);

    return data({
      data: revisions,
      meta: {
        count: revisions.length,
        caseId,
        latest: revisions[0],
        limit: options.limit,
        offset: options.offset,
      },
    });
  } catch (error) {
    console.error("Failed to fetch revisions:", error);
    return data(
      {
        error: "リビジョン履歴の取得に失敗しました",
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
 *
 * パスパラメータ:
 * - caseId: テストケースのstable ID
 *
 * リクエストボディ:
 * - title: テストケースのタイトル
 * - content: テストケースの内容
 * - reason: リビジョン作成理由（必須）
 * - createdBy: 作成者のユーザーID
 *
 * @example
 * ```json
 * {
 *   "title": "ログイン機能のテスト（更新版）",
 *   "content": {
 *     "steps": [...],
 *     "expectedResult": "...",
 *     "tags": ["認証"],
 *     "priority": "HIGH",
 *     "environment": "staging"
 *   },
 *   "reason": "テスト手順を3ステップに詳細化",
 *   "createdBy": "uuid"
 * }
 * ```
 */
export async function action({ params, request }: ActionFunctionArgs) {
  try {
    const { caseId } = params;

    if (!caseId) {
      return data({ error: "caseIdは必須パラメータです" }, { status: 400 });
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
          error: "バリデーションに失敗しました",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validatedData = validation.data;

    // TestStepインスタンスに変換
    const steps = validatedData.content.steps.map(
      (step) =>
        new TestStep({
          stepNumber: step.stepNumber,
          action: step.action,
          expectedOutcome: step.expectedOutcome,
        }),
    );

    const program = createTestCaseRevision(caseId, {
      title: validatedData.title,
      content: new TestCaseContent({
        ...validatedData.content,
        steps,
      }),
      reason: validatedData.reason,
      createdBy: validatedData.createdBy,
    }).pipe(Effect.provide(TestCaseManagementLayer));

    const revision = await Effect.runPromise(program);

    return data(
      {
        data: revision,
        message: "リビジョンが作成されました",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create revision:", error);
    return data(
      {
        error: "リビジョンの作成に失敗しました",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
