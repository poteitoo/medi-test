import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { TestCaseManagementLayer } from "~/features/test-case-management/infrastructure/layers/test-case-layer";
import { listTestCases } from "~/features/test-case-management/application/usecases/list-test-cases";
import { createTestCase } from "~/features/test-case-management/application/usecases/create-test-case";
import {
  TestCaseContent,
  TestStep,
} from "~/features/test-case-management/domain/models/test-case-content";
import { createTestCaseSchema } from "~/lib/schemas/test-case";

/**
 * GET /api/test-cases
 *
 * プロジェクトのテストケース一覧を取得
 *
 * クエリパラメータ:
 * - projectId (required): プロジェクトID
 * - limit (optional): 取得する最大件数
 * - offset (optional): スキップする件数
 * - includeLatestRevision (optional): 最新リビジョンを含めるか（"true" または "false"）
 *
 * @example
 * GET /api/test-cases?projectId=uuid&limit=10&offset=0&includeLatestRevision=true
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return data(
        { error: "projectIdは必須パラメータです" },
        { status: 400 },
      );
    }

    // オプショナルなクエリパラメータを取得
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");
    const includeLatestRevisionParam =
      url.searchParams.get("includeLatestRevision");

    const options = {
      limit: limitParam ? Number(limitParam) : undefined,
      offset: offsetParam ? Number(offsetParam) : undefined,
      includeLatestRevision: includeLatestRevisionParam === "true",
    };

    const program = listTestCases(projectId, options).pipe(
      Effect.provide(TestCaseManagementLayer),
    );

    const testCases = await Effect.runPromise(program);

    return data({
      data: testCases,
      meta: {
        count: testCases.length,
        projectId,
        limit: options.limit,
        offset: options.offset,
        includeLatestRevision: options.includeLatestRevision,
      },
    });
  } catch (error) {
    console.error("Failed to fetch test cases:", error);
    return data(
      {
        error: "テストケースの取得に失敗しました",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/test-cases
 *
 * 新しいテストケースを作成
 *
 * リクエストボディ:
 * - projectId: プロジェクトID
 * - createdBy: 作成者のユーザーID
 * - title: テストケースのタイトル
 * - content: テストケースの内容
 * - reason (optional): 作成理由
 *
 * @example
 * ```json
 * {
 *   "projectId": "uuid",
 *   "createdBy": "uuid",
 *   "title": "ログイン機能のテスト",
 *   "content": {
 *     "steps": [
 *       {
 *         "stepNumber": 1,
 *         "action": "ログインページを開く",
 *         "expectedOutcome": "ログインフォームが表示される"
 *       }
 *     ],
 *     "expectedResult": "ダッシュボードが表示される",
 *     "tags": ["認証"],
 *     "priority": "HIGH",
 *     "environment": "staging"
 *   }
 * }
 * ```
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = createTestCaseSchema.safeParse(body);
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

    const program = createTestCase(
      validatedData.projectId,
      validatedData.createdBy,
      {
        title: validatedData.title,
        content: new TestCaseContent({
          ...validatedData.content,
          steps,
        }),
        reason: validatedData.reason,
      },
    ).pipe(Effect.provide(TestCaseManagementLayer));

    const revision = await Effect.runPromise(program);

    return data(
      {
        data: revision,
        message: "テストケースが作成されました",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create test case:", error);
    return data(
      {
        error: "テストケースの作成に失敗しました",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
