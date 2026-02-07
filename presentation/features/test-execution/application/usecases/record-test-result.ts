import { Effect } from "effect";
import { TestResultRepository } from "../ports/test-result-repository";
import { TestRunRepository } from "../ports/test-run-repository";
import type { ResultStatus } from "../../domain/models/result-status";
import type { Evidence, BugLink } from "../../domain/models/test-result";

/**
 * テスト結果記録の入力パラメータ
 */
export type RecordTestResultInput = {
  /**
   * テストランID
   */
  readonly runId: string;

  /**
   * テストランアイテムID
   */
  readonly runItemId: string;

  /**
   * 結果ステータス
   */
  readonly status: ResultStatus;

  /**
   * エビデンス（オプション）
   */
  readonly evidence?: Evidence;

  /**
   * バグリンク（オプション）
   */
  readonly bugLinks?: readonly BugLink[];

  /**
   * 実行者ユーザーID
   */
  readonly executedBy: string;
};

/**
 * テスト結果記録ユースケース
 *
 * テストケースの実行結果を記録する
 * 同じテストケースは複数回実行可能（最新結果が有効）
 *
 * @example
 * const program = recordTestResult({
 *   runId: "run-123",
 *   runItemId: "item-456",
 *   status: "PASS",
 *   executedBy: "user-789",
 * });
 */
export const recordTestResult = (input: RecordTestResultInput) =>
  Effect.gen(function* () {
    const testRunRepo = yield* TestRunRepository;
    const testResultRepo = yield* TestResultRepository;

    // テストランが存在するか確認
    yield* testRunRepo.findById(input.runId);

    // テスト結果を記録
    const result = yield* testResultRepo.create({
      runItemId: input.runItemId,
      status: input.status,
      evidence: input.evidence,
      bugLinks: input.bugLinks,
      executedBy: input.executedBy,
    });

    // テストランのステータスを自動更新（初回実行時）
    const { run } = yield* testRunRepo.findByIdWithItems(input.runId);
    if (run.status === "ASSIGNED") {
      yield* testRunRepo.updateStatus(input.runId, "IN_PROGRESS");
    }

    return result;
  });
