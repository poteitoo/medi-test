import { Effect } from "effect";
import { TestCaseRepository } from "../ports/test-case-repository";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";

/**
 * リビジョン履歴取得の入力パラメータ
 */
export type GetRevisionHistoryInput = {
  /**
   * テストケースID
   */
  readonly caseId: string;
};

/**
 * テストケースリビジョン履歴取得ユースケース
 *
 * テストケースのすべてのリビジョンを降順（新しい順）で取得する
 *
 * @example
 * const program = getTestCaseRevisionHistory({
 *   caseId: "case-123",
 * });
 *
 * const revisions = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 */
export const getTestCaseRevisionHistory = (input: GetRevisionHistoryInput) =>
  Effect.gen(function* () {
    const repo = yield* TestCaseRepository;

    // テストケースの存在確認
    yield* repo.findById(input.caseId);

    // すべてのリビジョンを取得
    const revisions = yield* repo.findAllRevisions(input.caseId);

    return revisions;
  });

/**
 * リビジョン履歴のレスポンス型
 */
export type RevisionHistory = readonly TestCaseRevision[];
