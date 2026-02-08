import { Effect } from "effect";
import { TestScenarioRepository } from "../ports/test-scenario-repository";
import type { TestScenarioRevision } from "../../domain/models/test-scenario-revision";
import type { TestScenarioItem } from "../../domain/models/test-scenario-revision";
import { TestScenarioNotFoundError } from "../../domain/errors/test-case-errors";
import { RevisionCreationError } from "../../domain/errors/revision-errors";

/**
 * テストシナリオ作成ユースケース
 *
 * 新しいテストシナリオを作成し、初期リビジョン（rev: 1, status: DRAFT）を自動生成します。
 * テストシナリオにはstable IDが割り当てられ、リビジョンが更新されてもIDは変わりません。
 *
 * テストシナリオは複数のテストケースを順序付けて管理し、一連のテストフローを表現します。
 * 各シナリオアイテムはテストケースリビジョンを参照します。
 *
 * 処理フロー:
 * 1. TestScenarioRepositoryを取得
 * 2. TestScenarioエンティティの作成（stable ID付与）
 * 3. 初期リビジョンとアイテムの作成（rev: 1, status: DRAFT）
 * 4. 作成されたリビジョンを返却
 *
 * @param projectId - プロジェクトID
 * @param createdBy - 作成者のユーザーID
 * @param initialData - 初期データ
 * @param initialData.title - シナリオのタイトル
 * @param initialData.description - シナリオの説明（省略可能）
 * @param initialData.items - シナリオに含まれるテストケース参照の配列
 * @param initialData.reason - 作成理由（省略可能）
 * @returns 作成されたテストシナリオリビジョン
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import { createTestScenario } from "./create-test-scenario";
 * import { TestScenarioItem } from "~/domain/models/test-scenario-revision";
 * import { TestCaseManagementLayer } from "~/infrastructure/layers";
 *
 * const program = createTestScenario(
 *   "proj-123",
 *   "user-456",
 *   {
 *     title: "ユーザー登録フロー",
 *     description: "新規ユーザーが登録から初回ログインまでのシナリオ",
 *     items: [
 *       new TestScenarioItem({
 *         caseRevisionId: "rev-001",
 *         order: 1,
 *         optionalFlag: false,
 *         note: "必須: 登録フォーム表示",
 *       }),
 *       new TestScenarioItem({
 *         caseRevisionId: "rev-002",
 *         order: 2,
 *         optionalFlag: false,
 *         note: "必須: ユーザー情報入力",
 *       }),
 *       new TestScenarioItem({
 *         caseRevisionId: "rev-003",
 *         order: 3,
 *         optionalFlag: true,
 *         note: "オプション: メール確認",
 *       }),
 *     ],
 *     reason: "ユーザー登録機能のリリース準備",
 *   },
 * );
 *
 * const revision = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 *
 * console.log(revision.scenarioStableId); // "scenario-xxx"
 * console.log(revision.rev); // 1
 * console.log(revision.status); // "DRAFT"
 * console.log(revision.getTotalCases()); // 3
 * console.log(revision.getRequiredCases()); // 2
 * console.log(revision.getOptionalCases()); // 1
 * ```
 */
export const createTestScenario = (
  projectId: string,
  createdBy: string,
  initialData: {
    readonly title: string;
    readonly description?: string;
    readonly items: readonly TestScenarioItem[];
    readonly reason?: string;
  },
): Effect.Effect<
  TestScenarioRevision,
  Error | RevisionCreationError | TestScenarioNotFoundError,
  TestScenarioRepository
> =>
  Effect.gen(function* () {
    // ステップ1: TestScenarioRepositoryを取得
    const repo = yield* TestScenarioRepository;

    // ステップ2: TestScenarioエンティティを作成（stable ID付与）
    const testScenario = yield* repo.create(projectId, createdBy);

    // ステップ3: 初期リビジョンとアイテムを作成（rev: 1, status: DRAFT）
    const initialRevision = yield* repo.createRevision(testScenario.id, {
      title: initialData.title,
      description: initialData.description,
      items: initialData.items,
      reason: initialData.reason ?? "初回作成",
      createdBy,
    });

    // ステップ4: 作成されたリビジョンを返却
    return initialRevision;
  });
