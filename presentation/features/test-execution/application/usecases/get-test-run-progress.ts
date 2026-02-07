import { Effect } from "effect";
import { TestRunRepository } from "../ports/test-run-repository";
import { TestResultRepository } from "../ports/test-result-repository";
import { SSEService, type TestRunProgressEvent } from "../ports/sse-service";
import { TestRunNotFoundError } from "~/features/test-execution/domain/errors/test-run-errors";

/**
 * Get Test Run Progress Use Case
 *
 * テストラン実行の進捗情報を取得し、SSE経由でリアルタイム更新を提供するユースケース
 *
 * @remarks
 * - テストランの現在の進捗（実行済み/合格/不合格等）を計算
 * - SSEストリームを作成してクライアントにリアルタイム配信
 * - React Router の loader から呼び出される
 *
 * @example
 * ```typescript
 * // Server-side loader
 * export async function loader({ params }: LoaderFunctionArgs) {
 *   const program = getTestRunProgress({
 *     runId: params.runId,
 *     enableSSE: true,
 *   }).pipe(Effect.provide(TestExecutionLayer));
 *
 *   const result = await Effect.runPromise(program);
 *
 *   if (result.sseStream) {
 *     return new Response(result.sseStream, {
 *       headers: {
 *         "Content-Type": "text/event-stream",
 *         "Cache-Control": "no-cache",
 *         "Connection": "keep-alive",
 *       },
 *     });
 *   }
 *
 *   return data(result.progress);
 * }
 *
 * // Client-side
 * const eventSource = new EventSource(`/api/test-runs/${runId}/progress`);
 * eventSource.onmessage = (event) => {
 *   const progress = JSON.parse(event.data);
 *   updateUI(progress);
 * };
 * ```
 */

export type GetTestRunProgressInput = {
  readonly runId: string;
  readonly enableSSE?: boolean;
};

export type TestRunProgress = {
  readonly runId: string;
  readonly status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
  readonly progress: {
    readonly total: number;
    readonly executed: number;
    readonly passed: number;
    readonly failed: number;
    readonly blocked: number;
    readonly skipped: number;
  };
  readonly timestamp: string;
};

export type GetTestRunProgressResult = {
  readonly progress: TestRunProgress;
  readonly sseStream?: ReadableStream<Uint8Array>;
};

export const getTestRunProgress = (input: GetTestRunProgressInput) =>
  Effect.gen(function* () {
    const testRunRepo = yield* TestRunRepository;
    const testResultRepo = yield* TestResultRepository;

    // Fetch test run with items
    const { run, items } = yield* testRunRepo.findByIdWithItems(input.runId);

    if (!run) {
      return yield* Effect.fail(
        new TestRunNotFoundError({
          message: "テストランが見つかりません",
          runId: input.runId,
        }),
      );
    }

    // Fetch all results for this run
    const results = yield* testResultRepo.findByRunId(input.runId);

    // Calculate progress
    const executed = new Set(results.map((r) => r.runItemId)).size;
    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;
    const blocked = results.filter((r) => r.status === "BLOCKED").length;
    const skipped = results.filter((r) => r.status === "SKIPPED").length;

    const progress: TestRunProgress = {
      runId: input.runId,
      status: run.status,
      progress: {
        total: items.length,
        executed,
        passed,
        failed,
        blocked,
        skipped,
      },
      timestamp: new Date().toISOString(),
    };

    // Create SSE stream if enabled
    let sseStream: ReadableStream<Uint8Array> | undefined;

    if (input.enableSSE) {
      const sseService = yield* SSEService;
      sseStream = yield* sseService.createProgressStream(input.runId);
    }

    return {
      progress,
      sseStream,
    };
  });

/**
 * Get Run Group Progress Use Case
 *
 * テストラングループ全体の進捗を取得
 *
 * @remarks
 * - グループ内の全テストランの進捗を集計
 * - SSE経由でリアルタイム更新を提供
 */
export type GetRunGroupProgressInput = {
  readonly runGroupId: string;
  readonly enableSSE?: boolean;
};

export type RunGroupProgress = {
  readonly runGroupId: string;
  readonly runs: readonly TestRunProgress[];
  readonly summary: {
    readonly totalRuns: number;
    readonly completedRuns: number;
    readonly totalTests: number;
    readonly executedTests: number;
    readonly passedTests: number;
    readonly failedTests: number;
  };
  readonly timestamp: string;
};

export type GetRunGroupProgressResult = {
  readonly progress: RunGroupProgress;
  readonly sseStream?: ReadableStream<Uint8Array>;
};

export const getRunGroupProgress = (input: GetRunGroupProgressInput) =>
  Effect.gen(function* () {
    const testRunRepo = yield* TestRunRepository;
    const testResultRepo = yield* TestResultRepository;

    // Fetch all runs in the group
    const runs = yield* testRunRepo.findByRunGroupId(input.runGroupId);

    // Calculate progress for each run
    const runProgresses = yield* Effect.forEach(runs, (run) =>
      Effect.gen(function* () {
        const { items } = yield* testRunRepo.findByIdWithItems(run.id);
        const results = yield* testResultRepo.findByRunId(run.id);

        const executed = new Set(results.map((r) => r.runItemId)).size;
        const passed = results.filter((r) => r.status === "PASS").length;
        const failed = results.filter((r) => r.status === "FAIL").length;
        const blocked = results.filter((r) => r.status === "BLOCKED").length;
        const skipped = results.filter((r) => r.status === "SKIPPED").length;

        return {
          runId: run.id,
          status: run.status,
          progress: {
            total: items.length,
            executed,
            passed,
            failed,
            blocked,
            skipped,
          },
          timestamp: new Date().toISOString(),
        };
      }),
    );

    // Calculate group summary
    const summary = {
      totalRuns: runs.length,
      completedRuns: runs.filter((r) => r.status === "COMPLETED").length,
      totalTests: runProgresses.reduce((sum, r) => sum + r.progress.total, 0),
      executedTests: runProgresses.reduce((sum, r) => sum + r.progress.executed, 0),
      passedTests: runProgresses.reduce((sum, r) => sum + r.progress.passed, 0),
      failedTests: runProgresses.reduce((sum, r) => sum + r.progress.failed, 0),
    };

    const progress: RunGroupProgress = {
      runGroupId: input.runGroupId,
      runs: runProgresses,
      summary,
      timestamp: new Date().toISOString(),
    };

    // Create SSE stream if enabled
    let sseStream: ReadableStream<Uint8Array> | undefined;

    if (input.enableSSE) {
      const sseService = yield* SSEService;
      sseStream = yield* sseService.createRunGroupProgressStream(input.runGroupId);
    }

    return {
      progress,
      sseStream,
    };
  });
