import { Effect } from "effect";
import { TestCaseRepository } from "../ports/test-case-repository";
import type { TestCase } from "../../domain/models/test-case";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";

/**
 * テストケース一覧取得の入力パラメータ
 */
export type ListTestCasesInput = {
  /**
   * プロジェクトID
   */
  readonly projectId: string;
};

/**
 * テストケース一覧のレスポンス型
 */
export type TestCaseWithLatestRevision = {
  /**
   * テストケース
   */
  readonly testCase: TestCase;

  /**
   * 最新のリビジョン
   */
  readonly latestRevision: TestCaseRevision;
};

/**
 * テストケース一覧取得ユースケース
 *
 * プロジェクトに属するすべてのテストケースを、最新リビジョンと共に取得する
 *
 * @example
 * const program = listTestCases({
 *   projectId: "project-123",
 * });
 *
 * const testCases = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 */
export const listTestCases = (input: ListTestCasesInput) =>
  Effect.gen(function* () {
    const repo = yield* TestCaseRepository;

    // プロジェクトのすべてのテストケースを取得
    const testCases = yield* repo.findByProjectId(input.projectId);

    // 各テストケースの最新リビジョンを取得
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
  });
