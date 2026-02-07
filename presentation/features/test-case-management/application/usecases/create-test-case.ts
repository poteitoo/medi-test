import { Effect } from "effect";
import { TestCaseRepository } from "../ports/test-case-repository";
import type { TestCaseContent } from "../../domain/models/test-case-content";
import { validateTestCaseContent } from "../../domain/models/test-case-content";
import { RevisionValidationError } from "../../domain/errors/revision-errors";

/**
 * テストケース作成の入力パラメータ
 */
export type CreateTestCaseInput = {
  /**
   * プロジェクトID
   */
  readonly projectId: string;

  /**
   * テストケースのタイトル
   */
  readonly title: string;

  /**
   * テストケースの内容
   */
  readonly content: TestCaseContent;

  /**
   * 作成者ユーザーID
   */
  readonly createdBy: string;
};

/**
 * テストケース作成ユースケース
 *
 * 新しいテストケースを作成し、初期リビジョン（rev: 1）を自動的に作成する
 *
 * @example
 * const program = createTestCase({
 *   projectId: "project-123",
 *   title: "ログイン機能のテスト",
 *   content: new TestCaseContent({
 *     steps: ["ログイン画面を開く", "認証情報を入力"],
 *     expected_result: "ダッシュボードが表示される",
 *   }),
 *   createdBy: "user-456",
 * });
 *
 * const testCase = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 */
export const createTestCase = (input: CreateTestCaseInput) =>
  Effect.gen(function* () {
    // バリデーション
    const validation = validateTestCaseContent(input.content);
    if (!validation.valid) {
      return yield* Effect.fail(
        new RevisionValidationError({
          message: "テストケースの内容が不正です",
          errors: validation.errors,
        }),
      );
    }

    // リポジトリからテストケースを作成
    const repo = yield* TestCaseRepository;
    const testCase = yield* repo.create({
      projectId: input.projectId,
      title: input.title,
      content: input.content,
      createdBy: input.createdBy,
    });

    return testCase;
  });
