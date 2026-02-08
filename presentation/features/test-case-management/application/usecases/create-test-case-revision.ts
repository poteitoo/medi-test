import { Effect } from "effect";
import { TestCaseRepository } from "../ports/test-case-repository";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";
import type { TestCaseContent } from "../../domain/models/test-case-content";
import { validateTestCaseContent } from "../../domain/models/test-case-content";
import { TestCaseNotFoundError } from "../../domain/errors/test-case-errors";
import {
  RevisionCreationError,
  RevisionValidationError,
} from "../../domain/errors/revision-errors";
import { InvalidStatusTransitionError } from "../../domain/errors/status-errors";

/**
 * テストケースリビジョン作成ユースケース
 *
 * 既存のテストケースに新しいリビジョンを作成します。
 * リビジョン番号は最新リビジョンから自動的にインクリメントされ、
 * ステータスはDRAFTで開始されます。
 *
 * 処理フロー:
 * 1. TestCaseRepositoryを取得
 * 2. 最新リビジョンを取得して次のリビジョン番号を決定
 * 3. 前回のリビジョンがAPPROVED状態であることを検証
 * 4. 新しいリビジョンを作成（status: DRAFT）
 * 5. 作成されたリビジョンを返却
 *
 * ビジネスルール:
 * - 前回のリビジョンがAPPROVED状態でなければ新規リビジョンを作成できません
 * - 新規リビジョンは常にDRAFT状態で作成されます
 * - リビジョン番号は自動採番されます（前回rev + 1）
 *
 * @param caseId - テストケースのstable ID
 * @param data - リビジョンデータ
 * @param data.title - テストケースのタイトル
 * @param data.content - テストケースの内容
 * @param data.reason - リビジョン作成理由
 * @param data.createdBy - 作成者のユーザーID
 * @returns 作成されたテストケースリビジョン
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import { createTestCaseRevision } from "./create-test-case-revision";
 * import { TestCaseManagementLayer } from "~/infrastructure/layers";
 *
 * const program = createTestCaseRevision("case-123", {
 *   title: "ログイン機能のテスト（更新版）",
 *   content: new TestCaseContent({
 *     steps: [
 *       new TestStep({ stepNumber: 1, action: "ログイン画面を開く", expectedOutcome: "ログインフォームが表示される" }),
 *       new TestStep({ stepNumber: 2, action: "認証情報を入力", expectedOutcome: "入力欄にテキストが表示される" }),
 *       new TestStep({ stepNumber: 3, action: "ログインボタンをクリック", expectedOutcome: "ダッシュボードにリダイレクト" }),
 *     ],
 *     expectedResult: "ダッシュボードが表示される",
 *     tags: ["認証", "ログイン"],
 *     priority: "HIGH",
 *     environment: "staging",
 *   }),
 *   reason: "テスト手順を3ステップに詳細化",
 *   createdBy: "user-456",
 * });
 *
 * const revision = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 *
 * console.log(revision.rev); // 2 (前回が1の場合)
 * console.log(revision.status); // "DRAFT"
 * console.log(revision.reason); // "テスト手順を3ステップに詳細化"
 * ```
 */
export const createTestCaseRevision = (
  caseId: string,
  data: {
    readonly title: string;
    readonly content: TestCaseContent;
    readonly reason: string;
    readonly createdBy: string;
  },
): Effect.Effect<
  TestCaseRevision,
  | RevisionCreationError
  | TestCaseNotFoundError
  | RevisionValidationError
  | InvalidStatusTransitionError,
  TestCaseRepository
> =>
  Effect.gen(function* () {
    // ステップ1: TestCaseRepositoryを取得
    const repo = yield* TestCaseRepository;

    // テストケース内容のバリデーション
    const validation = validateTestCaseContent(data.content);
    if (!validation.valid) {
      return yield* Effect.fail(
        new RevisionValidationError({
          message: "テストケースの内容が不正です",
          errors: validation.errors,
        }),
      );
    }

    // ステップ2: 最新リビジョンを取得して次のリビジョン番号を決定
    const latestRevision = yield* repo.findLatestRevision(caseId);

    if (latestRevision === null) {
      return yield* Effect.fail(
        new TestCaseNotFoundError({
          caseId,
          message: `テストケース ${caseId} にリビジョンが存在しません`,
        }),
      );
    }

    // ステップ3: 前回のリビジョンがAPPROVED状態であることを検証
    if (!latestRevision.isApproved()) {
      return yield* Effect.fail(
        new InvalidStatusTransitionError({
          from: latestRevision.status,
          to: "DRAFT",
          message: `新規リビジョンを作成するには前回のリビジョンがAPPROVED状態である必要があります（現在: ${latestRevision.status}）`,
        }),
      );
    }

    // ステップ4: 新しいリビジョンを作成（status: DRAFT）
    const newRevision = yield* repo.createRevision(caseId, {
      title: data.title,
      content: data.content,
      reason: data.reason,
      createdBy: data.createdBy,
    });

    // ステップ5: 作成されたリビジョンを返却
    return newRevision;
  });
