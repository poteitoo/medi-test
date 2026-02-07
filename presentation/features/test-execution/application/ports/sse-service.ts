import { Context, Effect, Stream } from "effect";

/**
 * SSEService Port
 *
 * Server-Sent Events (SSE) を使用したリアルタイム通知を提供するポート
 *
 * @remarks
 * - テスト実行の進捗をリアルタイムで配信
 * - ブラウザの SSE API を使用
 * - React Router の loader で SSE レスポンスを返す際に使用
 */

export type SSEEvent<T = unknown> = {
  readonly id?: string;
  readonly event?: string;
  readonly data: T;
  readonly retry?: number;
};

export type TestRunProgressEvent = {
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

export type TestResultRecordedEvent = {
  readonly runId: string;
  readonly runItemId: string;
  readonly resultId: string;
  readonly status: "PASS" | "FAIL" | "BLOCKED" | "SKIPPED";
  readonly executedBy: string;
  readonly timestamp: string;
};

export class SSEConnectionError extends Error {
  readonly _tag = "SSEConnectionError";
  constructor(
    readonly message: string,
    readonly cause?: Error,
  ) {
    super(message);
    this.name = "SSEConnectionError";
  }
}

/**
 * SSEService Service Tag
 *
 * @example
 * ```typescript
 * // Server-side (loader)
 * export async function loader({ params }: LoaderFunctionArgs) {
 *   const sseService = yield* SSEService;
 *   const stream = yield* sseService.createProgressStream(params.runId);
 *   return new Response(stream, {
 *     headers: {
 *       "Content-Type": "text/event-stream",
 *       "Cache-Control": "no-cache",
 *       "Connection": "keep-alive",
 *     },
 *   });
 * }
 *
 * // Client-side
 * const eventSource = new EventSource(`/api/test-runs/${runId}/progress`);
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   // Update UI
 * };
 * ```
 */
export class SSEService extends Context.Tag("SSEService")<
  SSEService,
  {
    /**
     * テストラン進捗のSSEストリームを作成
     *
     * @param runId - テストランID
     * @returns ReadableStream for SSE
     */
    readonly createProgressStream: (
      runId: string,
    ) => Effect.Effect<ReadableStream<Uint8Array>, SSEConnectionError>;

    /**
     * テストラングループ全体の進捗ストリームを作成
     *
     * @param runGroupId - テストラングループID
     * @returns ReadableStream for SSE
     */
    readonly createRunGroupProgressStream: (
      runGroupId: string,
    ) => Effect.Effect<ReadableStream<Uint8Array>, SSEConnectionError>;

    /**
     * SSEイベントをフォーマット
     *
     * @param event - SSEイベントデータ
     * @returns SSE形式の文字列
     */
    readonly formatEvent: <T>(event: SSEEvent<T>) => string;

    /**
     * イベントをクライアントに送信
     *
     * @param runId - テストランID
     * @param event - 送信するイベント
     */
    readonly sendEvent: <T>(
      runId: string,
      event: SSEEvent<T>,
    ) => Effect.Effect<void, SSEConnectionError>;
  }
>() {}
