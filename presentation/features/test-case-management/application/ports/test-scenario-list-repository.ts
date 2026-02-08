import { Context, Effect } from "effect";
import type { TestScenarioList } from "../../domain/models/test-scenario-list";
import type {
  TestScenarioListRevision,
  TestScenarioListItem,
} from "../../domain/models/test-scenario-list-revision";
import type { RevisionStatus } from "../../domain/models/revision-status";
import type { TestScenarioListNotFoundError } from "../../domain/errors/test-case-errors";
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
 * TestScenarioListRepository Port
 *
 * テストシナリオリストのデータアクセスを抽象化するポートインターフェース。
 * Infrastructure層でこのポートを実装し、Application層で依存性注入を通じて使用します。
 *
 * このポートは以下の責務を持ちます:
 * - テストシナリオリストのCRUD操作（複数のシナリオをグループ化）
 * - テストシナリオリストリビジョンの管理
 * - リビジョン履歴の取得とステータス管理
 *
 * テストシナリオリストは複数のテストシナリオを束ねて、リリースサイクルや
 * スプリントなどのより大きなテスト範囲を表現します。各リストはリビジョン管理されます。
 *
 * すべてのメソッドはEffect型を返し、エラーハンドリングと依存性管理を提供します。
 *
 * @example
 * // ユースケースでの使用例
 * ```typescript
 * import { Effect } from "effect";
 * import { TestScenarioListRepository } from "../ports/test-scenario-list-repository";
 *
 * export const createTestScenarioList = (projectId: string, createdBy: string) =>
 *   Effect.gen(function* () {
 *     const repo = yield* TestScenarioListRepository;
 *     const list = yield* repo.create(projectId, createdBy);
 *     return list;
 *   });
 *
 * // Layerを使った実行例
 * const program = createTestScenarioList("proj-123", "user-456").pipe(
 *   Effect.provide(TestScenarioListRepositoryLive)
 * );
 *
 * await Effect.runPromise(program);
 * ```
 */
export class TestScenarioListRepository extends Context.Tag(
  "TestScenarioListRepository",
)<
  TestScenarioListRepository,
  {
    /**
     * 新規テストシナリオリストを作成
     *
     * プロジェクトに紐づく新しいテストシナリオリストを作成します。
     * 作成時は初期リビジョンも同時に生成されます。
     *
     * @param projectId - プロジェクトID
     * @param createdBy - 作成者のユーザーID
     * @returns 作成されたテストシナリオリスト、またはエラー
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioListRepository;
     * const list = yield* repo.create("proj-123", "user-456");
     * console.log(list.id); // "list-xxx"
     * ```
     */
    readonly create: (
      projectId: string,
      createdBy: string,
    ) => Effect.Effect<TestScenarioList, Error>;

    /**
     * IDでテストシナリオリストを検索
     *
     * 指定されたIDのテストシナリオリストを取得します。
     * 存在しない場合はnullを返します（エラーではありません）。
     *
     * @param listId - テストシナリオリストID
     * @returns テストシナリオリスト、またはnull
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioListRepository;
     * const list = yield* repo.findById("list-123");
     * if (list === null) {
     *   console.log("テストシナリオリストが見つかりません");
     * }
     * ```
     */
    readonly findById: (
      listId: string,
    ) => Effect.Effect<TestScenarioList | null, never>;

    /**
     * プロジェクトIDでテストシナリオリスト一覧を取得
     *
     * 指定されたプロジェクトに属するすべてのテストシナリオリストを取得します。
     * ページネーションオプションを指定して結果を制限できます。
     *
     * @param projectId - プロジェクトID
     * @param options - ページネーションオプション（省略可能）
     * @returns テストシナリオリストの配列
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioListRepository;
     *
     * // すべて取得
     * const allLists = yield* repo.findByProjectId("proj-123");
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
    ) => Effect.Effect<readonly TestScenarioList[], never>;

    /**
     * テストシナリオリストの新規リビジョンを作成
     *
     * 既存のテストシナリオリストに対して新しいリビジョンを作成します。
     * リビジョンは内容の履歴管理とレビューフローに使用されます。
     *
     * @param listId - テストシナリオリストID
     * @param data - リビジョンデータ
     * @param data.title - タイトル
     * @param data.description - 説明（省略可能）
     * @param data.items - リストに含まれるテストシナリオの参照配列
     * @param data.reason - 変更理由
     * @param data.createdBy - 作成者のユーザーID
     * @returns 作成されたリビジョン、またはエラー
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioListRepository;
     * const revision = yield* repo.createRevision("list-123", {
     *   title: "v2.0 リリーステスト",
     *   description: "バージョン2.0のリリースに向けた包括的なテストシナリオ集",
     *   items: [
     *     { testScenarioId: "scenario-001", order: 1 },
     *     { testScenarioId: "scenario-002", order: 2 },
     *     { testScenarioId: "scenario-003", order: 3 }
     *   ],
     *   reason: "新機能シナリオを追加",
     *   createdBy: "user-456"
     * });
     * ```
     */
    readonly createRevision: (
      listId: string,
      data: {
        readonly title: string;
        readonly description?: string;
        readonly items: readonly TestScenarioListItem[];
        readonly reason: string;
        readonly createdBy: string;
      },
    ) => Effect.Effect<
      TestScenarioListRevision,
      RevisionCreationError | TestScenarioListNotFoundError
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
     * const repo = yield* TestScenarioListRepository;
     * const revision = yield* repo.findRevisionById("rev-789");
     * if (revision !== null) {
     *   console.log(revision.status); // "DRAFT" | "IN_REVIEW" | "APPROVED"
     *   console.log(`含まれるシナリオ数: ${revision.items.length}`);
     * }
     * ```
     */
    readonly findRevisionById: (
      revisionId: string,
    ) => Effect.Effect<TestScenarioListRevision | null, never>;

    /**
     * テストシナリオリストの最新リビジョンを取得
     *
     * 指定されたテストシナリオリストの最新リビジョンを取得します。
     * リビジョンが存在しない場合はnullを返します。
     *
     * @param listId - テストシナリオリストID
     * @returns 最新のリビジョン、またはnull
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioListRepository;
     * const latestRevision = yield* repo.findLatestRevision("list-123");
     * if (latestRevision !== null) {
     *   console.log(`最新リビジョン番号: ${latestRevision.revisionNumber}`);
     *   console.log(`タイトル: ${latestRevision.title}`);
     * }
     * ```
     */
    readonly findLatestRevision: (
      listId: string,
    ) => Effect.Effect<TestScenarioListRevision | null, never>;

    /**
     * テストシナリオリストのリビジョン履歴を取得
     *
     * 指定されたテストシナリオリストのすべてのリビジョンを取得します。
     * リビジョン番号の降順（新しい順）でソートされます。
     *
     * @param listId - テストシナリオリストID
     * @param options - ページネーションオプション（省略可能）
     * @returns リビジョンの配列
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioListRepository;
     *
     * // すべての履歴を取得
     * const history = yield* repo.findRevisionHistory("list-123");
     * history.forEach((rev) => {
     *   console.log(`v${rev.revisionNumber}: ${rev.title} (${rev.items.length}シナリオ)`);
     * });
     *
     * // 最新5件のみ取得
     * const recentHistory = yield* repo.findRevisionHistory("list-123", {
     *   limit: 5,
     *   offset: 0
     * });
     * ```
     */
    readonly findRevisionHistory: (
      listId: string,
      options?: PaginationOptions,
    ) => Effect.Effect<readonly TestScenarioListRevision[], never>;

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
     * const repo = yield* TestScenarioListRepository;
     *
     * // レビュー提出
     * const submitted = yield* repo.updateRevisionStatus(
     *   "rev-789",
     *   "IN_REVIEW"
     * );
     *
     * // 承認
     * const approved = yield* repo.updateRevisionStatus(
     *   "rev-789",
     *   "APPROVED"
     * );
     * ```
     */
    readonly updateRevisionStatus: (
      revisionId: string,
      status: RevisionStatus,
    ) => Effect.Effect<
      TestScenarioListRevision,
      RevisionImmutableError | InvalidStatusTransitionError
    >;

    /**
     * テストシナリオリストを削除
     *
     * 指定されたIDのテストシナリオリストとそのすべてのリビジョンを削除します。
     * この操作は取り消せません。
     *
     * @param listId - テストシナリオリストID
     * @returns void、またはエラー
     *
     * @example
     * ```typescript
     * const repo = yield* TestScenarioListRepository;
     * yield* repo.deleteList("list-123");
     * console.log("テストシナリオリストを削除しました");
     * ```
     */
    readonly deleteList: (
      listId: string,
    ) => Effect.Effect<void, TestScenarioListNotFoundError>;
  }
>() {}
