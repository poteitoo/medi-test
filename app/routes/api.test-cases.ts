import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { TestCaseManagementLayer } from "~/features/test-case-management/infrastructure/layers/test-case-layer";
import { listTestCases } from "~/features/test-case-management/application/usecases/list-test-cases";
import { createTestCase } from "~/features/test-case-management/application/usecases/create-test-case";
import { TestCaseContent } from "~/features/test-case-management/domain/models/test-case-content";
import { createTestCaseSchema } from "~/lib/schemas/test-case";

/**
 * GET /api/test-cases
 *
 * プロジェクトのテストケース一覧を取得
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return data({ error: "projectId is required" }, { status: 400 });
    }

    const program = listTestCases({ projectId }).pipe(
      Effect.provide(TestCaseManagementLayer),
    );

    const testCases = await Effect.runPromise(program);

    return data({
      data: testCases,
      meta: {
        count: testCases.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch test cases:", error);
    return data(
      {
        error: "Failed to fetch test cases",
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
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = createTestCaseSchema.safeParse(body);
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
    const projectId = validatedData.projectId;
    const title = validatedData.title;
    const content = validatedData.content;
    const createdBy = validatedData.createdBy;

    const program = createTestCase({
      projectId,
      title,
      content: new TestCaseContent(content),
      createdBy,
    }).pipe(Effect.provide(TestCaseManagementLayer));

    const testCase = await Effect.runPromise(program);

    return data(
      {
        data: testCase,
        message: "Test case created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create test case:", error);
    return data(
      {
        error: "Failed to create test case",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
