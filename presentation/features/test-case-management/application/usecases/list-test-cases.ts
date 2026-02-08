import { Effect } from "effect";
import { TestCaseRepository } from "../ports/test-case-repository";
import type { TestCase } from "../../domain/models/test-case";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";

/**
 * テストケース一覧取得ユースケース
 *
 * 指定されたプロジェクトに属するすべてのテストケースを取得します。
 * オプションで最新リビジョンも同時に取得できます。
 *
 * 処理フロー:
 * 1. TestCaseRepositoryを取得
 * 2. プロジェクトIDでテストケース一覧を検索
 * 3. includeLatestRevisionがtrueの場合、各テストケースの最新リビジョンを取得
 * 4. ページネーションを適用（optionsが指定されている場合）
 * 5. テストケース配列を返却
 *
 * @param projectId - プロジェクトID
 * @param options - オプション設定
 * @param options.limit - 取得する最大件数（省略可能）
 * @param options.offset - スキップする件数（省略可能）
 * @param options.includeLatestRevision - 最新リビジョンを含めるか（デフォルト: false）
 * @returns テストケース配列、または最新リビジョン付きテストケース配列
 *
 * @example
 * // テストケースのみ取得
 * ```typescript
 * import { Effect } from "effect";
 * import { listTestCases } from "./list-test-cases";
 * import { TestCaseManagementLayer } from "~/infrastructure/layers";
 *
 * const program = listTestCases("proj-123");
 *
 * const testCases = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 *
 * testCases.forEach((testCase) => {
 *   console.log(testCase.id);
 * });
 * ```
 *
 * @example
 * // 最新リビジョン付きで取得
 * ```typescript
 * const program = listTestCases("proj-123", {
 *   includeLatestRevision: true,
 *   limit: 10,
 *   offset: 0,
 * });
 *
 * const testCasesWithRevisions = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 *
 * testCasesWithRevisions.forEach(({ testCase, latestRevision }) => {
 *   console.log(`${testCase.id}: ${latestRevision?.title ?? "リビジョンなし"}`);
 * });
 * ```
 */
export const listTestCases = (
  projectId: string,
  options?: {
    readonly limit?: number;
    readonly offset?: number;
    readonly includeLatestRevision?: boolean;
  },
): Effect.Effect<
  readonly TestCase[] | readonly TestCaseWithLatestRevision[],
  never,
  TestCaseRepository
> =>
  Effect.gen(function* () {
    // ステップ1: TestCaseRepositoryを取得
    const repo = yield* TestCaseRepository;

    // ステップ2: プロジェクトIDでテストケース一覧を検索
    const testCases = yield* repo.findByProjectId(projectId, {
      limit: options?.limit,
      offset: options?.offset,
    });

    // ステップ3: includeLatestRevisionがtrueの場合、各テストケースの最新リビジョンを取得
    if (options?.includeLatestRevision === true) {
      const testCasesWithRevisions = yield* Effect.all(
        testCases.map((testCase) =>
          Effect.gen(function* () {
            const latestRevision = yield* repo.findLatestRevision(testCase.id);
            return {
              testCase,
              latestRevision,
            };
          }),
        ),
      );

      return testCasesWithRevisions;
    }

    // ステップ5: テストケース配列を返却
    return testCases;
  });

/**
 * テストケースと最新リビジョンのペア
 */
export type TestCaseWithLatestRevision = {
  /**
   * テストケース
   */
  readonly testCase: TestCase;

  /**
   * 最新のリビジョン（存在しない場合はnull）
   */
  readonly latestRevision: TestCaseRevision | null;
};
