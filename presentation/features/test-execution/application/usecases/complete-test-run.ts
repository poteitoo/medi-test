import { Effect } from "effect";
import { TestRunRepository } from "../ports/test-run-repository";
import { TestResultRepository } from "../ports/test-result-repository";
import { InvalidRunStatusError } from "../../domain/errors/test-run-errors";

/**
 * テストラン完了の入力パラメータ
 */
export type CompleteTestRunInput = {
  /**
   * テストランID
   */
  readonly runId: string;

  /**
   * 強制完了フラグ（未実行テストがあっても完了する）
   */
  readonly force?: boolean;
};

/**
 * テストラン完了ユースケース
 *
 * テストランのステータスをCOMPLETEDに変更
 * デフォルトでは全テストケースが実行済みの場合のみ完了可能
 *
 * @example
 * const program = completeTestRun({ runId: "run-123" });
 */
export const completeTestRun = (input: CompleteTestRunInput) =>
  Effect.gen(function* () {
    const testRunRepo = yield* TestRunRepository;
    const testResultRepo = yield* TestResultRepository;

    // テストランとアイテムを取得
    const { run, items } = yield* testRunRepo.findByIdWithItems(input.runId);

    // IN_PROGRESSステータスのみ完了可能
    if (run.status !== "IN_PROGRESS") {
      return yield* Effect.fail(
        new InvalidRunStatusError({
          message: "テストランは実行中ではありません",
          currentStatus: run.status,
          expectedStatus: "IN_PROGRESS",
        }),
      );
    }

    // 強制完了でない場合、全アイテムの実行をチェック
    if (!input.force) {
      for (const item of items) {
        const latestResult = yield* testResultRepo.findLatestByRunItemId(
          item.id,
        );
        if (!latestResult) {
          return yield* Effect.fail(
            new Error(
              `未実行のテストケースがあります。force: true で強制完了するか、全てのテストケースを実行してください。`,
            ),
          );
        }
      }
    }

    // ステータスをCOMPLETEDに更新
    const updatedRun = yield* testRunRepo.updateStatus(input.runId, "COMPLETED");

    // 完了サマリーを計算
    const results = yield* testResultRepo.findByRunId(input.runId);
    const summary = {
      total: items.length,
      executed: new Set(results.map((r) => r.runItemId)).size,
      passed: results.filter((r) => r.status === "PASS").length,
      failed: results.filter((r) => r.status === "FAIL").length,
      blocked: results.filter((r) => r.status === "BLOCKED").length,
      skipped: results.filter((r) => r.status === "SKIPPED").length,
    };

    return {
      run: updatedRun,
      summary,
    };
  });
