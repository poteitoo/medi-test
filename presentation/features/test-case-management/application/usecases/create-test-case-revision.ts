import { Effect } from "effect";
import { TestCaseRepository } from "../ports/test-case-repository";
import type { TestCaseContent } from "../../domain/models/test-case-content";
import { validateTestCaseContent } from "../../domain/models/test-case-content";
import { RevisionValidationError } from "../../domain/errors/revision-errors";

/**
 * テストケースリビジョン作成の入力パラメータ
 */
export type CreateTestCaseRevisionInput = {
  /**
   * テストケースID
   */
  readonly caseId: string;

  /**
   * リビジョンのタイトル
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
 * テストケースリビジョン作成ユースケース
 *
 * 既存のテストケースに新しいリビジョンを追加する
 * リビジョン番号は自動的にインクリメントされる
 *
 * @example
 * const program = createTestCaseRevision({
 *   caseId: "case-123",
 *   title: "ログイン機能のテスト（更新版）",
 *   content: new TestCaseContent({
 *     steps: ["ログイン画面を開く", "認証情報を入力", "ログインボタンをクリック"],
 *     expected_result: "ダッシュボードが表示される",
 *   }),
 *   createdBy: "user-456",
 * });
 */
export const createTestCaseRevision = (input: CreateTestCaseRevisionInput) =>
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

    // テストケースの存在確認
    const repo = yield* TestCaseRepository;
    yield* repo.findById(input.caseId);

    // 新しいリビジョンを作成
    const revision = yield* repo.createRevision({
      caseId: input.caseId,
      title: input.title,
      content: input.content,
      createdBy: input.createdBy,
    });

    return revision;
  });
