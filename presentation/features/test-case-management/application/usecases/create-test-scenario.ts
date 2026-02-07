import { Effect } from "effect";
import { TestScenarioRepository } from "../ports/test-scenario-repository";
import type { TestScenarioCaseRef } from "../../domain/models/test-scenario-revision";

/**
 * テストシナリオ作成の入力パラメータ
 */
export type CreateTestScenarioInput = {
  /**
   * プロジェクトID
   */
  readonly projectId: string;

  /**
   * シナリオのタイトル
   */
  readonly title: string;

  /**
   * シナリオの説明
   */
  readonly description?: string;

  /**
   * 含まれるテストケースのリスト
   */
  readonly testCases: readonly TestScenarioCaseRef[];

  /**
   * 作成者ユーザーID
   */
  readonly createdBy: string;
};

/**
 * テストシナリオ作成ユースケース
 *
 * 新しいテストシナリオを作成し、初期リビジョン（rev: 1）を自動的に作成する
 * テストシナリオは複数のテストケースをまとめたもの
 *
 * @example
 * const program = createTestScenario({
 *   projectId: "project-123",
 *   title: "ログイン〜ログアウトのシナリオ",
 *   description: "ユーザー認証フローの統合テスト",
 *   testCases: [
 *     new TestScenarioCaseRef({
 *       caseId: "case-1",
 *       revisionNumber: 1,
 *       order: 1,
 *     }),
 *     new TestScenarioCaseRef({
 *       caseId: "case-2",
 *       revisionNumber: 2,
 *       order: 2,
 *     }),
 *   ],
 *   createdBy: "user-456",
 * });
 */
export const createTestScenario = (input: CreateTestScenarioInput) =>
  Effect.gen(function* () {
    const repo = yield* TestScenarioRepository;

    // テストシナリオを作成
    const scenario = yield* repo.create({
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      testCases: input.testCases,
      createdBy: input.createdBy,
    });

    return scenario;
  });
