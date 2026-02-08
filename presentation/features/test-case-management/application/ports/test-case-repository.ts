import { Context, Effect } from "effect";
import type { TestCase } from "../../domain/models/test-case";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";
import type { RevisionStatus } from "../../domain/models/revision-status";
import type { TestCaseContent } from "../../domain/models/test-case-content";
import type {
  TestCaseNotFoundError,
  TestCaseCreationError,
} from "../../domain/errors/test-case-errors";
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
 * TestCaseRepository Port
 *
 * テストケースのデータアクセスを抽象化するポートインターフェース。
 * Infrastructure層でこのポートを実装し、Application層で依存性注入を通じて使用します。
 *
 * このポートは以下の責務を持ちます:
 * - テストケースのCRUD操作
 * - テストケースリビジョンの管理
 * - リビジョン履歴の取得とステータス管理
 *
 * すべてのメソッドはEffect型を返し、エラーハンドリングと依存性管理を提供します。
 *
 * @example
 * // ユースケースでの使用例
 * ```typescript
 * import { Effect } from "effect";
 * import { TestCaseRepository } from "../ports/test-case-repository";
 *
 * export const createTestCase = (projectId: string, createdBy: string) =>
 *   Effect.gen(function* () {
 *     const repo = yield* TestCaseRepository;
 *     const testCase = yield* repo.create(projectId, createdBy);
 *     return testCase;
 *   });
 *
 * // Layerを使った実行例
 * const program = createTestCase("proj-123", "user-456").pipe(
 *   Effect.provide(TestCaseRepositoryLive)
 * );
 *
 * await Effect.runPromise(program);
 * ```
 */
export class TestCaseRepository extends Context.Tag("TestCaseRepository")<
  TestCaseRepository,
  {
    /**
     * 新規テストケースを作成
     *
     * プロジェクトに紐づく新しいテストケースを作成します。
     * 作成時は初期リビジョンも同時に生成されます。
     *
     * @param projectId - プロジェクトID
     * @param createdBy - 作成者のユーザーID
     * @returns 作成されたテストケース、またはエラー
     *
     * @example
     * ```typescript
     * const repo = yield* TestCaseRepository;
     * const testCase = yield* repo.create("proj-123", "user-456");
     * console.log(testCase.id); // "case-xxx"
     * ```
     */
    readonly create: (
      projectId: string,
      createdBy: string,
    ) => Effect.Effect<TestCase, TestCaseCreationError>;

    /**
     * IDでテストケースを検索
     *
     * 指定されたIDのテストケースを取得します。
     * 存在しない場合はnullを返します（エラーではありません）。
     *
     * @param caseId - テストケースID
     * @returns テストケース、またはnull
     *
     * @example
     * ```typescript
     * const repo = yield* TestCaseRepository;
     * const testCase = yield* repo.findById("case-123");
     * if (testCase === null) {
     *   console.log("テストケースが見つかりません");
     * }
     * ```
     */
    readonly findById: (
      caseId: string,
    ) => Effect.Effect<TestCase | null, never>;

    /**
     * プロジェクトIDでテストケース一覧を取得
     *
     * 指定されたプロジェクトに属するすべてのテストケースを取得します。
     * ページネーションオプションを指定して結果を制限できます。
     *
     * @param projectId - プロジェクトID
     * @param options - ページネーションオプション（省略可能）
     * @returns テストケースの配列
     *
     * @example
     * ```typescript
     * const repo = yield* TestCaseRepository;
     *
     * // すべて取得
     * const allCases = yield* repo.findByProjectId("proj-123");
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
    ) => Effect.Effect<readonly TestCase[], never>;

    /**
     * テストケースの新規リビジョンを作成
     *
     * 既存のテストケースに対して新しいリビジョンを作成します。
     * リビジョンは内容の履歴管理とレビューフローに使用されます。
     *
     * @param caseId - テストケースID
     * @param data - リビジョンデータ
     * @param data.title - タイトル
     * @param data.content - テストケースの内容
     * @param data.reason - 変更理由
     * @param data.createdBy - 作成者のユーザーID
     * @returns 作成されたリビジョン、またはエラー
     *
     * @example
     * ```typescript
     * const repo = yield* TestCaseRepository;
     * const revision = yield* repo.createRevision("case-123", {
     *   title: "ログイン機能のテスト",
     *   content: {
     *     steps: [
     *       { order: 1, description: "ログインページを開く" },
     *       { order: 2, description: "ユーザー名を入力" }
     *     ],
     *     expectedResults: "正常にログインできること"
     *   },
     *   reason: "テスト手順の明確化",
     *   createdBy: "user-456"
     * });
     * ```
     */
    readonly createRevision: (
      caseId: string,
      data: {
        readonly title: string;
        readonly content: TestCaseContent;
        readonly reason: string;
        readonly createdBy: string;
      },
    ) => Effect.Effect<
      TestCaseRevision,
      RevisionCreationError | TestCaseNotFoundError
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
     * const repo = yield* TestCaseRepository;
     * const revision = yield* repo.findRevisionById("rev-123");
     * if (revision !== null) {
     *   console.log(revision.status); // "DRAFT" | "IN_REVIEW" | "APPROVED"
     * }
     * ```
     */
    readonly findRevisionById: (
      revisionId: string,
    ) => Effect.Effect<TestCaseRevision | null, never>;

    /**
     * テストケースの最新リビジョンを取得
     *
     * 指定されたテストケースの最新リビジョンを取得します。
     * リビジョンが存在しない場合はnullを返します。
     *
     * @param caseId - テストケースID
     * @returns 最新のリビジョン、またはnull
     *
     * @example
     * ```typescript
     * const repo = yield* TestCaseRepository;
     * const latestRevision = yield* repo.findLatestRevision("case-123");
     * if (latestRevision !== null) {
     *   console.log(`最新リビジョン番号: ${latestRevision.revisionNumber}`);
     * }
     * ```
     */
    readonly findLatestRevision: (
      caseId: string,
    ) => Effect.Effect<TestCaseRevision | null, never>;

    /**
     * テストケースのリビジョン履歴を取得
     *
     * 指定されたテストケースのすべてのリビジョンを取得します。
     * リビジョン番号の降順（新しい順）でソートされます。
     *
     * @param caseId - テストケースID
     * @param options - ページネーションオプション（省略可能）
     * @returns リビジョンの配列
     *
     * @example
     * ```typescript
     * const repo = yield* TestCaseRepository;
     *
     * // すべての履歴を取得
     * const history = yield* repo.findRevisionHistory("case-123");
     * history.forEach((rev) => {
     *   console.log(`v${rev.revisionNumber}: ${rev.title}`);
     * });
     *
     * // 最新5件のみ取得
     * const recentHistory = yield* repo.findRevisionHistory("case-123", {
     *   limit: 5,
     *   offset: 0
     * });
     * ```
     */
    readonly findRevisionHistory: (
      caseId: string,
      options?: PaginationOptions,
    ) => Effect.Effect<readonly TestCaseRevision[], never>;

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
     * const repo = yield* TestCaseRepository;
     *
     * // レビュー提出
     * const submitted = yield* repo.updateRevisionStatus(
     *   "rev-123",
     *   "IN_REVIEW"
     * );
     *
     * // 承認
     * const approved = yield* repo.updateRevisionStatus(
     *   "rev-123",
     *   "APPROVED"
     * );
     * ```
     */
    readonly updateRevisionStatus: (
      revisionId: string,
      status: RevisionStatus,
    ) => Effect.Effect<
      TestCaseRevision,
      RevisionImmutableError | InvalidStatusTransitionError
    >;

    /**
     * テストケースを削除
     *
     * 指定されたIDのテストケースとそのすべてのリビジョンを削除します。
     * この操作は取り消せません。
     *
     * @param caseId - テストケースID
     * @returns void、またはエラー
     *
     * @example
     * ```typescript
     * const repo = yield* TestCaseRepository;
     * yield* repo.deleteCase("case-123");
     * console.log("テストケースを削除しました");
     * ```
     */
    readonly deleteCase: (
      caseId: string,
    ) => Effect.Effect<void, TestCaseNotFoundError>;
  }
>() {}
