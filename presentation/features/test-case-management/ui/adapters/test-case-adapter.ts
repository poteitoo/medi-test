import { Effect } from "effect";
import type { TestCase } from "../../domain/models/test-case";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";
import type { TestCaseContent } from "../../domain/models/test-case-content";
import { TestCaseManagementLayer } from "../../infrastructure/layers/test-case-layer";
import { createTestCase } from "../../application/usecases/create-test-case";
import { createTestCaseRevision } from "../../application/usecases/create-test-case-revision";
import { submitForReview } from "../../application/usecases/submit-for-review";
import { listTestCases } from "../../application/usecases/list-test-cases";
import type { TestCaseWithLatestRevision } from "../../application/usecases/list-test-cases";
import { getTestCaseRevisionHistory } from "../../application/usecases/get-revision-history";

/**
 * テストケース作成アダプター
 *
 * 新しいテストケースを作成し、初期リビジョン（rev: 1, status: DRAFT）を返します。
 * Effect TSプログラムを実行してPromiseで結果を返します。
 *
 * @param projectId - プロジェクトID
 * @param createdBy - 作成者のユーザーID
 * @param data - テストケースデータ
 * @param data.title - テストケースのタイトル
 * @param data.content - テストケースの内容
 * @param data.reason - 作成理由（省略可能）
 * @returns Promise<TestCaseRevision> - 作成されたテストケースリビジョン
 * @throws Error - テストケースの作成に失敗した場合
 *
 * @example
 * ```typescript
 * const revision = await executeCreateTestCase(
 *   "proj-123",
 *   "user-456",
 *   {
 *     title: "ログイン機能のテスト",
 *     content: new TestCaseContent({
 *       steps: [...],
 *       expectedResult: "ダッシュボードが表示される",
 *       tags: ["認証"],
 *       priority: "HIGH",
 *       environment: "staging",
 *     }),
 *   }
 * );
 *
 * console.log(revision.caseStableId); // "case-xxx"
 * console.log(revision.rev); // 1
 * console.log(revision.status); // "DRAFT"
 * ```
 */
export async function executeCreateTestCase(
  projectId: string,
  createdBy: string,
  data: {
    readonly title: string;
    readonly content: TestCaseContent;
    readonly reason?: string;
  },
): Promise<TestCaseRevision> {
  const program = createTestCase(projectId, createdBy, data).pipe(
    Effect.provide(TestCaseManagementLayer),
  ) as Effect.Effect<TestCaseRevision>;
  return await Effect.runPromise(program);
}

/**
 * リビジョン作成アダプター
 *
 * 既存のテストケースに新しいリビジョンを作成します。
 * リビジョン番号は自動的にインクリメントされ、ステータスはDRAFTで開始されます。
 *
 * @param caseId - テストケースのstable ID
 * @param data - リビジョンデータ
 * @param data.title - テストケースのタイトル
 * @param data.content - テストケースの内容
 * @param data.reason - リビジョン作成理由
 * @param data.createdBy - 作成者のユーザーID
 * @returns Promise<TestCaseRevision> - 作成されたテストケースリビジョン
 * @throws Error - リビジョンの作成に失敗した場合
 *
 * @example
 * ```typescript
 * const revision = await executeCreateRevision("case-123", {
 *   title: "ログイン機能のテスト（更新版）",
 *   content: new TestCaseContent({...}),
 *   reason: "テスト手順を3ステップに詳細化",
 *   createdBy: "user-456",
 * });
 *
 * console.log(revision.rev); // 2（前回が1の場合）
 * console.log(revision.status); // "DRAFT"
 * ```
 */
export async function executeCreateRevision(
  caseId: string,
  data: {
    readonly title: string;
    readonly content: TestCaseContent;
    readonly reason: string;
    readonly createdBy: string;
  },
): Promise<TestCaseRevision> {
  const program = createTestCaseRevision(caseId, data).pipe(
    Effect.provide(TestCaseManagementLayer),
  ) as Effect.Effect<TestCaseRevision>;
  return await Effect.runPromise(program);
}

/**
 * レビュー提出アダプター
 *
 * テストケースリビジョンをレビュー中（IN_REVIEW）状態に遷移させます。
 * DRAFT状態のリビジョンのみ提出可能です。
 *
 * @param revisionId - リビジョンID
 * @param submittedBy - 提出者のユーザーID
 * @returns Promise<TestCaseRevision> - 更新されたテストケースリビジョン
 * @throws Error - レビュー提出に失敗した場合
 *
 * @example
 * ```typescript
 * const updatedRevision = await executeSubmitForReview("rev-123", "user-456");
 *
 * console.log(updatedRevision.status); // "IN_REVIEW"
 * ```
 */
export async function executeSubmitForReview(
  revisionId: string,
  submittedBy: string,
): Promise<TestCaseRevision> {
  const program = submitForReview(revisionId, submittedBy).pipe(
    Effect.provide(TestCaseManagementLayer),
  ) as Effect.Effect<TestCaseRevision>;
  return await Effect.runPromise(program);
}

/**
 * テストケース一覧取得アダプター
 *
 * 指定されたプロジェクトに属するすべてのテストケースを取得します。
 * オプションで最新リビジョンも同時に取得できます。
 *
 * @param projectId - プロジェクトID
 * @param options - 取得オプション
 * @param options.limit - 取得する最大件数（省略可能）
 * @param options.offset - スキップする件数（省略可能）
 * @param options.includeLatestRevision - 最新リビジョンを含めるか（デフォルト: false）
 * @returns Promise<TestCase[]> | Promise<TestCaseWithLatestRevision[]> - テストケース配列
 * @throws Error - テストケース一覧の取得に失敗した場合
 *
 * @example
 * ```typescript
 * // テストケースのみ取得
 * const testCases = await executeListTestCases("proj-123");
 * testCases.forEach(testCase => {
 *   console.log(testCase.id);
 * });
 *
 * // 最新リビジョン付きで取得
 * const testCasesWithRevisions = await executeListTestCases("proj-123", {
 *   includeLatestRevision: true,
 *   limit: 10,
 * });
 * testCasesWithRevisions.forEach(({ testCase, latestRevision }) => {
 *   console.log(`${testCase.id}: ${latestRevision?.title ?? "リビジョンなし"}`);
 * });
 * ```
 */
export async function executeListTestCases(
  projectId: string,
  options?: {
    readonly limit?: number;
    readonly offset?: number;
    readonly includeLatestRevision?: boolean;
  },
): Promise<readonly TestCase[] | readonly TestCaseWithLatestRevision[]> {
  const program = listTestCases(projectId, options).pipe(
    Effect.provide(TestCaseManagementLayer),
  ) as Effect.Effect<
    readonly TestCase[] | readonly TestCaseWithLatestRevision[]
  >;
  return await Effect.runPromise(program);
}

/**
 * リビジョン履歴取得アダプター
 *
 * 指定されたテストケースのすべてのリビジョンを取得します。
 * リビジョンは新しい順（rev降順）でソートされます。
 *
 * @param caseId - テストケースのstable ID
 * @param options - 取得オプション
 * @param options.limit - 取得する最大件数（省略可能）
 * @param options.offset - スキップする件数（省略可能）
 * @returns Promise<TestCaseRevision[]> - テストケースリビジョンの配列（新しい順）
 * @throws Error - リビジョン履歴の取得に失敗した場合
 *
 * @example
 * ```typescript
 * // 全履歴を取得
 * const revisions = await executeGetRevisionHistory("case-123");
 * revisions.forEach(revision => {
 *   console.log(`rev.${revision.rev}: ${revision.title} (${revision.status})`);
 * });
 *
 * // 最新5件を取得
 * const recentRevisions = await executeGetRevisionHistory("case-123", {
 *   limit: 5,
 *   offset: 0,
 * });
 * ```
 */
export async function executeGetRevisionHistory(
  caseId: string,
  options?: {
    readonly limit?: number;
    readonly offset?: number;
  },
): Promise<readonly TestCaseRevision[]> {
  const program = getTestCaseRevisionHistory(caseId, options).pipe(
    Effect.provide(TestCaseManagementLayer),
  ) as Effect.Effect<readonly TestCaseRevision[]>;
  return await Effect.runPromise(program);
}
