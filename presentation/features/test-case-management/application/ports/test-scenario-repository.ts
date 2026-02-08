import { Context, Effect } from "effect";
import type { TestScenario } from "../../domain/models/test-scenario";
import type {
  TestScenarioRevision,
  TestScenarioItem,
} from "../../domain/models/test-scenario-revision";
import type { RevisionStatus } from "../../domain/models/revision-status";
import type { TestScenarioNotFoundError } from "../../domain/errors/test-case-errors";
import type {
  RevisionCreationError,
  RevisionImmutableError,
} from "../../domain/errors/revision-errors";
import type { InvalidStatusTransitionError } from "../../domain/errors/status-errors";

/**
 * ページネーションオプション
 *
 * リスト取得時のページネーション設定を提供します。
 *
 * @property limit - 取得する最大件数（省略時はリポジトリのデフォルト値）
 * @property offset - スキップする件数（省略時は0）
 */
export type PaginationOptions = {
  readonly limit?: number;
  readonly offset?: number;
};

/**
 * TestScenarioRepository Port
 *
 * テストシナリオのデータアクセスを抽象化するポートインターフェース。
 * Infrastructure層でこのポートを実装し、Application層で依存性注入を通じて使用します。
 *
 * このポートは以下の責務を持ちます:
 * - テストシナリオのCRUD操作（複数のテストケースをグループ化）
 * - テストシナリオリビジョンの管理
 * - リビジョン履歴の取得とステータス管理
 *
 * テストシナリオは複数のテストケースを束ねて、特定のユーザーストーリーや
 * 機能テストを表現します。各シナリオはリビジョン管理されます。
 *
 * すべてのメソッドはEffect型を返し、エラーハンドリングと依存性管理を提供します。
 *
 * @example
 * // ユースケースでの使用例
 * ```typescript
 * import { Effect } from "effect";
 * import { TestScenarioRepository } from "../ports/test-scenario-repository";
 *
 * export const createTestScenario = (projectId: string, createdBy: string) =>
 *   Effect.gen(function* () {
 *     const repo = yield* TestScenarioRepository;
 *     const scenario = yield* repo.create(projectId, createdBy);
 *     return scenario;
 *   });
 *
 * // Layerを使った実行例
 * const program = createTestScenario("proj-123", "user-456").pipe(
 *   Effect.provide(TestScenarioRepositoryLive)
 * );
 *
 * await Effect.runPromise(program);
 * ```
 */
export class TestScenarioRepository extends Context.Tag(
  "TestScenarioRepository",
)<
  TestScenarioRepository,
  {
    /**
     * 新規テストシナリオを作成
     *
     * プロジェクトに紐づく新しいテストシナリオを作成します。
     * 作成時は初期リビジョンも同時に生成されます。
     *
     * @param projectId - プロジェクトID
     * @param createdBy - 作成者のユーザーID
     * @returns 作成されたテストシナリオ、またはエラー
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioRepository;
     * const scenario = yield* repo.create("proj-123", "user-456");
     * console.log(scenario.id); // "scenario-xxx"
     * ```
     */
    readonly create: (
      projectId: string,
      createdBy: string,
    ) => Effect.Effect<TestScenario, Error>;

    /**
     * IDでテストシナリオを検索
     *
     * 指定されたIDのテストシナリオを取得します。
     * 存在しない場合はnullを返します（エラーではありません）。
     *
     * @param scenarioId - テストシナリオID
     * @returns テストシナリオ、またはnull
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioRepository;
     * const scenario = yield* repo.findById("scenario-123");
     * if (scenario === null) {
     *   console.log("テストシナリオが見つかりません");
     * }
     * ```
     */
    readonly findById: (
      scenarioId: string,
    ) => Effect.Effect<TestScenario | null, never>;

    /**
     * プロジェクトIDでテストシナリオ一覧を取得
     *
     * 指定されたプロジェクトに属するすべてのテストシナリオを取得します。
     * ページネーションオプションを指定して結果を制限できます。
     *
     * @param projectId - プロジェクトID
     * @param options - ページネーションオプション（省略可能）
     * @returns テストシナリオの配列
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioRepository;
     *
     * // すべて取得
     * const allScenarios = yield* repo.findByProjectId("proj-123");
     *
     * // 10件ずつページネーション
     * const firstPage = yield* repo.findByProjectId("proj-123", {
     *   limit: 10,
     *   offset: 0
     * });
     * const secondPage = yield* repo.findByProjectId("proj-123", {
     *   limit: 10,
     *   offset: 10
     * });
     * ```
     */
    readonly findByProjectId: (
      projectId: string,
      options?: PaginationOptions,
    ) => Effect.Effect<readonly TestScenario[], never>;

    /**
     * テストシナリオの新規リビジョンを作成
     *
     * 既存のテストシナリオに対して新しいリビジョンを作成します。
     * リビジョンは内容の履歴管理とレビューフローに使用されます。
     *
     * @param scenarioId - テストシナリオID
     * @param data - リビジョンデータ
     * @param data.title - タイトル
     * @param data.description - 説明（省略可能）
     * @param data.items - シナリオに含まれるテストケースの参照配列
     * @param data.reason - 変更理由
     * @param data.createdBy - 作成者のユーザーID
     * @returns 作成されたリビジョン、またはエラー
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioRepository;
     * const revision = yield* repo.createRevision("scenario-123", {
     *   title: "ユーザー登録フロー",
     *   description: "新規ユーザーが登録から初回ログインまでのシナリオ",
     *   items: [
     *     { testCaseId: "case-001", order: 1 },
     *     { testCaseId: "case-002", order: 2 },
     *     { testCaseId: "case-003", order: 3 }
     *   ],
     *   reason: "テストケースの順序を最適化",
     *   createdBy: "user-456"
     * });
     * ```
     */
    readonly createRevision: (
      scenarioId: string,
      data: {
        readonly title: string;
        readonly description?: string;
        readonly items: readonly TestScenarioItem[];
        readonly reason: string;
        readonly createdBy: string;
      },
    ) => Effect.Effect<
      TestScenarioRevision,
      RevisionCreationError | TestScenarioNotFoundError
    >;

    /**
     * リビジョンIDでリビジョンを検索
     *
     * 指定されたIDのリビジョンを取得します。
     * 存在しない場合はnullを返します。
     *
     * @param revisionId - リビジョンID
     * @returns リビジョン、またはnull
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioRepository;
     * const revision = yield* repo.findRevisionById("rev-456");
     * if (revision !== null) {
     *   console.log(revision.status); // "DRAFT" | "IN_REVIEW" | "APPROVED"
     *   console.log(`含まれるテストケース数: ${revision.items.length}`);
     * }
     * ```
     */
    readonly findRevisionById: (
      revisionId: string,
    ) => Effect.Effect<TestScenarioRevision | null, never>;

    /**
     * テストシナリオの最新リビジョンを取得
     *
     * 指定されたテストシナリオの最新リビジョンを取得します。
     * リビジョンが存在しない場合はnullを返します。
     *
     * @param scenarioId - テストシナリオID
     * @returns 最新のリビジョン、またはnull
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioRepository;
     * const latestRevision = yield* repo.findLatestRevision("scenario-123");
     * if (latestRevision !== null) {
     *   console.log(`最新リビジョン番号: ${latestRevision.revisionNumber}`);
     *   console.log(`タイトル: ${latestRevision.title}`);
     * }
     * ```
     */
    readonly findLatestRevision: (
      scenarioId: string,
    ) => Effect.Effect<TestScenarioRevision | null, never>;

    /**
     * テストシナリオのリビジョン履歴を取得
     *
     * 指定されたテストシナリオのすべてのリビジョンを取得します。
     * リビジョン番号の降順（新しい順）でソートされます。
     *
     * @param scenarioId - テストシナリオID
     * @param options - ページネーションオプション（省略可能）
     * @returns リビジョンの配列
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioRepository;
     *
     * // すべての履歴を取得
     * const history = yield* repo.findRevisionHistory("scenario-123");
     * history.forEach((rev) => {
     *   console.log(`v${rev.revisionNumber}: ${rev.title} (${rev.items.length}件)`);
     * });
     *
     * // 最新5件のみ取得
     * const recentHistory = yield* repo.findRevisionHistory("scenario-123", {
     *   limit: 5,
     *   offset: 0
     * });
     * ```
     */
    readonly findRevisionHistory: (
      scenarioId: string,
      options?: PaginationOptions,
    ) => Effect.Effect<readonly TestScenarioRevision[], never>;

    /**
     * リビジョンのステータスを更新
     *
     * リビジョンのステータスを変更します。
     * ステータス遷移ルールに従って検証が行われます。
     *
     * 有効なステータス遷移:
     * - DRAFT → IN_REVIEW: レビュー提出
     * - IN_REVIEW → APPROVED: 承認
     * - IN_REVIEW → DRAFT: 差し戻し
     * - APPROVED → DEPRECATED: 非推奨化
     *
     * 無効な遷移:
     * - APPROVED → IN_REVIEW: 承認済みからの戻しは不可
     * - DEPRECATED → *: 非推奨からの遷移は不可
     *
     * @param revisionId - リビジョンID
     * @param status - 新しいステータス
     * @returns 更新されたリビジョン、またはエラー
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioRepository;
     *
     * // レビュー提出
     * const submitted = yield* repo.updateRevisionStatus(
     *   "rev-456",
     *   "IN_REVIEW"
     * );
     *
     * // 承認
     * const approved = yield* repo.updateRevisionStatus(
     *   "rev-456",
     *   "APPROVED"
     * );
     * ```
     */
    readonly updateRevisionStatus: (
      revisionId: string,
      status: RevisionStatus,
    ) => Effect.Effect<
      TestScenarioRevision,
      RevisionImmutableError | InvalidStatusTransitionError
    >;

    /**
     * テストシナリオを削除
     *
     * 指定されたIDのテストシナリオとそのすべてのリビジョンを削除します。
     * この操作は取り消せません。
     *
     * @param scenarioId - テストシナリオID
     * @returns void、またはエラー
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioRepository;
     * yield* repo.deleteScenario("scenario-123");
     * console.log("テストシナリオを削除しました");
     * ```
     */
    readonly deleteScenario: (
      scenarioId: string,
    ) => Effect.Effect<void, TestScenarioNotFoundError>;
  }
>() {}
