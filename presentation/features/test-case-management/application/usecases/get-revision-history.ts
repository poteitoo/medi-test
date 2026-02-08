import { Effect } from "effect";
import { TestCaseRepository } from "../ports/test-case-repository";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";

/**
 * テストケースリビジョン履歴取得ユースケース
 *
 * 指定されたテストケースのすべてのリビジョンを取得します。
 * リビジョンは新しい順（rev降順）でソートされます。
 *
 * 処理フロー:
 * 1. TestCaseRepositoryを取得
 * 2. テストケースのリビジョン履歴を検索
 * 3. リビジョン番号の降順でソート（新しい順）
 * 4. ページネーションを適用（optionsが指定されている場合）
 * 5. リビジョン配列を返却
 *
 * @param caseId - テストケースのstable ID
 * @param options - オプション設定
 * @param options.limit - 取得する最大件数（省略可能）
 * @param options.offset - スキップする件数（省略可能）
 * @returns テストケースリビジョンの配列（新しい順）
 *
 * @example
 * // 全履歴を取得
 * ```typescript
 * import { Effect } from "effect";
 * import { getTestCaseRevisionHistory } from "./get-revision-history";
 * import { TestCaseManagementLayer } from "~/infrastructure/layers";
 *
 * const program = getTestCaseRevisionHistory("case-123");
 *
 * const revisions = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 *
 * revisions.forEach((revision) => {
 *   console.log(`rev.${revision.rev}: ${revision.title} (${revision.status})`);
 * });
 * // 出力例:
 * // rev.3: ログイン機能のテスト v3 (APPROVED)
 * // rev.2: ログイン機能のテスト v2 (APPROVED)
 * // rev.1: ログイン機能のテスト (DEPRECATED)
 * ```
 *
 * @example
 * // ページネーション付きで取得
 * ```typescript
 * // 最新5件を取得
 * const program = getTestCaseRevisionHistory("case-123", {
 *   limit: 5,
 *   offset: 0,
 * });
 *
 * const recentRevisions = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 *
 * console.log(`最新5件のリビジョン: ${recentRevisions.length}件`);
 * ```
 *
 * @example
 * // 2ページ目（6-10件目）を取得
 * ```typescript
 * const program = getTestCaseRevisionHistory("case-123", {
 *   limit: 5,
 *   offset: 5,
 * });
 * ```
 */
export const getTestCaseRevisionHistory = (
  caseId: string,
  options?: {
    readonly limit?: number;
    readonly offset?: number;
  },
): Effect.Effect<readonly TestCaseRevision[], never, TestCaseRepository> =>
  Effect.gen(function* () {
    // ステップ1: TestCaseRepositoryを取得
    const repo = yield* TestCaseRepository;

    // ステップ2-4: リビジョン履歴を検索（ソートとページネーションはリポジトリ層で実施）
    const revisions = yield* repo.findRevisionHistory(caseId, {
      limit: options?.limit,
      offset: options?.offset,
    });

    // ステップ5: リビジョン配列を返却
    return revisions;
  });
