import { Effect } from "effect";
import { TestScenarioListRepository } from "../ports/test-scenario-list-repository";
import type { TestScenarioListRevision } from "../../domain/models/test-scenario-list-revision";
import type { TestScenarioListItem } from "../../domain/models/test-scenario-list-revision";
import { TestScenarioListNotFoundError } from "../../domain/errors/test-case-errors";
import { RevisionCreationError } from "../../domain/errors/revision-errors";

/**
 * テストシナリオリスト作成ユースケース
 *
 * 新しいテストシナリオリストを作成し、初期リビジョン（rev: 1, status: DRAFT）を自動生成します。
 * テストシナリオリストにはstable IDが割り当てられ、リビジョンが更新されてもIDは変わりません。
 *
 * テストシナリオリストは複数のテストシナリオを順序付けて管理し、
 * リリースやスプリント単位でのテスト実行計画を表現します。
 * 各リストアイテムはテストシナリオリビジョンを参照します。
 *
 * 処理フロー:
 * 1. TestScenarioListRepositoryを取得
 * 2. TestScenarioListエンティティの作成（stable ID付与）
 * 3. 初期リビジョンとアイテムの作成（rev: 1, status: DRAFT）
 * 4. 作成されたリビジョンを返却
 *
 * @param projectId - プロジェクトID
 * @param createdBy - 作成者のユーザーID
 * @param initialData - 初期データ
 * @param initialData.title - リストのタイトル
 * @param initialData.description - リストの説明（省略可能）
 * @param initialData.items - リストに含まれるテストシナリオ参照の配列
 * @param initialData.reason - 作成理由（省略可能）
 * @returns 作成されたテストシナリオリストリビジョン
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import { createTestScenarioList } from "./create-test-scenario-list";
 * import { TestScenarioListItem } from "~/domain/models/test-scenario-list-revision";
 * import { TestCaseManagementLayer } from "~/infrastructure/layers";
 *
 * const program = createTestScenarioList(
 *   "proj-123",
 *   "user-456",
 *   {
 *     title: "v2.0 リリーステスト",
 *     description: "バージョン2.0のリリースに向けた包括的なテスト計画",
 *     items: [
 *       new TestScenarioListItem({
 *         scenarioRevisionId: "scenario-rev-001",
 *         order: 1,
 *         includeRule: "FULL",
 *         note: "ユーザー登録フロー - 全ケース実行",
 *       }),
 *       new TestScenarioListItem({
 *         scenarioRevisionId: "scenario-rev-002",
 *         order: 2,
 *         includeRule: "REQUIRED_ONLY",
 *         note: "支払いフロー - 必須ケースのみ",
 *       }),
 *       new TestScenarioListItem({
 *         scenarioRevisionId: "scenario-rev-003",
 *         order: 3,
 *         includeRule: "FULL",
 *         note: "管理者機能 - 全ケース実行",
 *       }),
 *     ],
 *     reason: "v2.0リリース準備",
 *   },
 * );
 *
 * const revision = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 *
 * console.log(revision.listStableId); // "list-xxx"
 * console.log(revision.rev); // 1
 * console.log(revision.status); // "DRAFT"
 * console.log(revision.getTotalScenarios()); // 3
 * ```
 */
export const createTestScenarioList = (
  projectId: string,
  createdBy: string,
  initialData: {
    readonly title: string;
    readonly description?: string;
    readonly items: readonly TestScenarioListItem[];
    readonly reason?: string;
  },
): Effect.Effect<
  TestScenarioListRevision,
  Error | RevisionCreationError | TestScenarioListNotFoundError,
  TestScenarioListRepository
> =>
  Effect.gen(function* () {
    // ステップ1: TestScenarioListRepositoryを取得
    const repo = yield* TestScenarioListRepository;

    // ステップ2: TestScenarioListエンティティを作成（stable ID付与）
    const testScenarioList = yield* repo.create(projectId, createdBy);

    // ステップ3: 初期リビジョンとアイテムを作成（rev: 1, status: DRAFT）
    const initialRevision = yield* repo.createRevision(testScenarioList.id, {
      title: initialData.title,
      description: initialData.description,
      items: initialData.items,
      reason: initialData.reason ?? "初回作成",
      createdBy,
    });

    // ステップ4: 作成されたリビジョンを返却
    return initialRevision;
  });
