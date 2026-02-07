import { Effect } from "effect";
import { TestRunRepository } from "../ports/test-run-repository";
import { InvalidRunStatusError } from "../../domain/errors/test-run-errors";

/**
 * テストラン開始の入力パラメータ
 */
export type StartTestRunInput = {
  /**
   * テストランID
   */
  readonly runId: string;
};

/**
 * テストラン開始ユースケース
 *
 * テストランのステータスをASSIGNEDからIN_PROGRESSに変更
 * 手動で開始する場合に使用（結果記録時は自動的に開始される）
 *
 * @example
 * const program = startTestRun({ runId: "run-123" });
 */
export const startTestRun = (input: StartTestRunInput) =>
  Effect.gen(function* () {
    const testRunRepo = yield* TestRunRepository;

    // テストランを取得
    const testRun = yield* testRunRepo.findById(input.runId);

    // ASSIGNEDステータスのみ開始可能
    if (testRun.status !== "ASSIGNED") {
      return yield* Effect.fail(
        new InvalidRunStatusError({
          message: "テストランは既に開始されています",
          currentStatus: testRun.status,
          expectedStatus: "ASSIGNED",
        }),
      );
    }

    // ステータスをIN_PROGRESSに更新
    const updatedRun = yield* testRunRepo.updateStatus(
      input.runId,
      "IN_PROGRESS",
    );

    return updatedRun;
  });
