import { Effect } from "effect";
import { TestCaseRepository } from "../ports/test-case-repository";
import { TestCase } from "../../domain/models/test-case";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";
import type { TestCaseContent } from "../../domain/models/test-case-content";
import { validateTestCaseContent } from "../../domain/models/test-case-content";
import {
  TestCaseCreationError,
  TestCaseNotFoundError,
} from "../../domain/errors/test-case-errors";
import {
  RevisionCreationError,
  RevisionValidationError,
} from "../../domain/errors/revision-errors";

/**
 * テストケース作成ユースケース
 *
 * 新しいテストケースを作成し、初期リビジョン（rev: 1, status: DRAFT）を自動生成します。
 * テストケースにはstable IDが割り当てられ、リビジョンが更新されてもIDは変わりません。
 *
 * 処理フロー:
 * 1. テストケース内容のバリデーション
 * 2. TestCaseエンティティの作成（stable ID付与）
 * 3. 初期リビジョンの作成（rev: 1, status: DRAFT）
 * 4. 作成されたリビジョンを返却
 *
 * @param projectId - プロジェクトID
 * @param createdBy - 作成者のユーザーID
 * @param initialData - 初期データ
 * @param initialData.title - テストケースのタイトル
 * @param initialData.content - テストケースの内容
 * @param initialData.reason - 作成理由（省略可能）
 * @returns 作成されたテストケースリビジョン
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import { createTestCase } from "./create-test-case";
 * import { TestCaseManagementLayer } from "~/infrastructure/layers";
 *
 * const program = createTestCase(
 *   "proj-123",
 *   "user-456",
 *   {
 *     title: "ログイン機能のテスト",
 *     content: new TestCaseContent({
 *       steps: [
 *         new TestStep({ stepNumber: 1, action: "ログイン画面を開く", expectedOutcome: "ログインフォームが表示される" }),
 *         new TestStep({ stepNumber: 2, action: "認証情報を入力", expectedOutcome: "入力欄にテキストが表示される" }),
 *       ],
 *       expectedResult: "ダッシュボードが表示される",
 *       tags: ["認証", "ログイン"],
 *       priority: "HIGH",
 *       environment: "staging",
 *     }),
 *     reason: "ログイン機能の初期テストケース作成",
 *   },
 * );
 *
 * const revision = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 *
 * console.log(revision.caseStableId); // "case-xxx"
 * console.log(revision.rev); // 1
 * console.log(revision.status); // "DRAFT"
 * ```
 */
export const createTestCase = (
  projectId: string,
  createdBy: string,
  initialData: {
    readonly title: string;
    readonly content: TestCaseContent;
    readonly reason?: string;
  },
): Effect.Effect<
  TestCaseRevision,
  | TestCaseCreationError
  | TestCaseNotFoundError
  | RevisionCreationError
  | RevisionValidationError,
  TestCaseRepository
> =>
  Effect.gen(function* () {
    // ステップ1: テストケース内容のバリデーション
    const validation = validateTestCaseContent(initialData.content);
    if (!validation.valid) {
      return yield* Effect.fail(
        new RevisionValidationError({
          message: "テストケースの内容が不正です",
          errors: validation.errors,
        }),
      );
    }

    // ステップ2-3: TestCaseリポジトリを取得し、テストケースと初期リビジョンを作成
    const repo = yield* TestCaseRepository;

    // TestCaseエンティティを作成（stable ID付与）
    const testCase = yield* repo.create(projectId, createdBy);

    // ステップ3: 初期リビジョンを作成（rev: 1, status: DRAFT）
    const initialRevision = yield* repo.createRevision(testCase.id, {
      title: initialData.title,
      content: initialData.content,
      reason: initialData.reason ?? "初回作成",
      createdBy,
    });

    // ステップ4: 作成されたリビジョンを返却
    return initialRevision;
  });
