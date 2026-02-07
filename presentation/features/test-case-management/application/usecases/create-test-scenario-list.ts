import { Effect } from "effect";
import { TestScenarioListRepository } from "../ports/test-scenario-list-repository";
import type { TestScenarioListItemRef } from "../../domain/models/test-scenario-list-revision";

/**
 * テストシナリオリスト作成の入力パラメータ
 */
export type CreateTestScenarioListInput = {
  /**
   * プロジェクトID
   */
  readonly projectId: string;

  /**
   * リストのタイトル
   */
  readonly title: string;

  /**
   * リストの説明
   */
  readonly description?: string;

  /**
   * 含まれるテストシナリオのリスト
   */
  readonly testScenarios: readonly TestScenarioListItemRef[];

  /**
   * 作成者ユーザーID
   */
  readonly createdBy: string;
};

/**
 * テストシナリオリスト作成ユースケース
 *
 * 新しいテストシナリオリストを作成し、初期リビジョン（rev: 1）を自動的に作成する
 * テストシナリオリストは複数のテストシナリオをまとめたもの
 *
 * @example
 * const program = createTestScenarioList({
 *   projectId: "project-123",
 *   title: "リリース 1.0 のテスト計画",
 *   description: "v1.0リリースに向けた統合テスト計画",
 *   testScenarios: [
 *     new TestScenarioListItemRef({
 *       scenarioId: "scenario-1",
 *       revisionNumber: 1,
 *       order: 1,
 *     }),
 *     new TestScenarioListItemRef({
 *       scenarioId: "scenario-2",
 *       revisionNumber: 3,
 *       order: 2,
 *     }),
 *   ],
 *   createdBy: "user-456",
 * });
 */
export const createTestScenarioList = (input: CreateTestScenarioListInput) =>
  Effect.gen(function* () {
    const repo = yield* TestScenarioListRepository;

    // テストシナリオリストを作成
    const list = yield* repo.create({
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      testScenarios: input.testScenarios,
      createdBy: input.createdBy,
    });

    return list;
  });
