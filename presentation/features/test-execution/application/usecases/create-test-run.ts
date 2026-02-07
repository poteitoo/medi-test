import { Effect } from "effect";
import { TestRunRepository } from "../ports/test-run-repository";

/**
 * テストラン作成の入力パラメータ
 */
export type CreateTestRunInput = {
  /**
   * テストラングループID
   */
  readonly runGroupId: string;

  /**
   * 担当者ユーザーID
   */
  readonly assigneeUserId: string;

  /**
   * ソーステストシナリオリストリビジョンID
   */
  readonly sourceListRevisionId: string;

  /**
   * ビルド参照（オプション）
   */
  readonly buildRef?: string;
};

/**
 * テストラン作成ユースケース
 *
 * テストシナリオリストからテストランを作成し、
 * テストケースを自動的にTestRunItemとして展開する
 *
 * @example
 * const program = createTestRun({
 *   runGroupId: "group-123",
 *   assigneeUserId: "user-456",
 *   sourceListRevisionId: "list-rev-789",
 *   buildRef: "abc123",
 * });
 */
export const createTestRun = (input: CreateTestRunInput) =>
  Effect.gen(function* () {
    const testRunRepo = yield* TestRunRepository;

    // テストランとアイテムを作成
    const result = yield* testRunRepo.create({
      runGroupId: input.runGroupId,
      assigneeUserId: input.assigneeUserId,
      sourceListRevisionId: input.sourceListRevisionId,
      buildRef: input.buildRef,
    });

    return result;
  });
