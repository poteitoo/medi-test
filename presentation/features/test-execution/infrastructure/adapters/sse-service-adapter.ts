import { Effect, Layer } from "effect";
import {
  SSEService,
  SSEConnectionError,
  type SSEEvent,
} from "~/features/test-execution/application/ports/sse-service";

/**
 * SSE Service Adapter
 *
 * Server-Sent Events (SSE) を使用したリアルタイム通知の実装
 *
 * @remarks
 * - ReadableStream を使用してSSEストリームを生成
 * - React Router の loader から Response として返される
 * - クライアントは EventSource API で受信
 *
 * @example Server-side usage:
 * ```typescript
 * export async function loader({ params }: LoaderFunctionArgs) {
 *   const program = Effect.gen(function* () {
 *     const sseService = yield* SSEService;
 *     const stream = yield* sseService.createProgressStream(params.runId);
 *     return stream;
 *   }).pipe(Effect.provide(SSEServiceLive));
 *
 *   const stream = await Effect.runPromise(program);
 *
 *   return new Response(stream, {
 *     headers: {
 *       "Content-Type": "text/event-stream",
 *       "Cache-Control": "no-cache",
 *       "Connection": "keep-alive",
 *     },
 *   });
 * }
 * ```
 *
 * @example Client-side usage:
 * ```typescript
 * const eventSource = new EventSource(`/api/test-runs/${runId}/progress`);
 *
 * eventSource.addEventListener("progress", (event) => {
 *   const data = JSON.parse(event.data);
 *   updateProgressUI(data);
 * });
 *
 * eventSource.addEventListener("complete", (event) => {
 *   eventSource.close();
 * });
 *
 * eventSource.onerror = (error) => {
 *   console.error("SSE error:", error);
 *   eventSource.close();
 * };
 * ```
 */

/**
 * SSE Format Helper
 *
 * SSEイベントを標準フォーマットにエンコード
 *
 * SSE Format:
 * ```
 * id: <event-id>
 * event: <event-type>
 * data: <json-data>
 * retry: <retry-ms>
 *
 * ```
 */
function formatSSEEvent<T>(event: SSEEvent<T>): string {
  let message = "";

  if (event.id) {
    message += `id: ${event.id}\n`;
  }

  if (event.event) {
    message += `event: ${event.event}\n`;
  }

  message += `data: ${JSON.stringify(event.data)}\n`;

  if (event.retry) {
    message += `retry: ${event.retry}\n`;
  }

  message += "\n"; // Empty line marks end of event

  return message;
}

/**
 * SSE Service Implementation (Stub)
 *
 * TODO: Implement actual event streaming with database polling or pub/sub
 *
 * 実装オプション:
 * 1. Database Polling: 定期的にDBをポーリングして変更を検出
 * 2. Pub/Sub: Redis Pub/Sub または EventEmitter でリアルタイム配信
 * 3. WebSocket: 双方向通信が必要な場合
 */
const SSEServiceImpl = {
  createProgressStream: (runId: string) =>
    Effect.gen(function* () {
      // Stub implementation
      // TODO: Implement actual SSE stream with real-time updates

      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();

          // Send initial connection event
          const connectionEvent = formatSSEEvent({
            event: "connected",
            data: { runId, timestamp: new Date().toISOString() },
          });
          controller.enqueue(encoder.encode(connectionEvent));

          // Stub: Send mock progress event after 1 second
          const timer = setTimeout(() => {
            const progressEvent = formatSSEEvent({
              event: "progress",
              data: {
                runId,
                status: "IN_PROGRESS",
                progress: {
                  total: 10,
                  executed: 5,
                  passed: 4,
                  failed: 1,
                  blocked: 0,
                  skipped: 0,
                },
                timestamp: new Date().toISOString(),
              },
            });
            controller.enqueue(encoder.encode(progressEvent));
          }, 1000);

          // TODO: Replace with actual implementation
          // - Database polling interval (e.g., every 1-5 seconds)
          // - Listen to pub/sub events
          // - Send events when test results are recorded
          // - Send completion event when run is completed
          // - Handle client disconnect

          // Cleanup on connection close
          // In production, this should cancel polling or unsubscribe from pub/sub
          return () => {
            clearTimeout(timer);
          };
        },

        cancel() {
          // Handle client disconnect
          // TODO: Cleanup resources (stop polling, unsubscribe, etc.)
        },
      });

      return stream;
    }),

  createRunGroupProgressStream: (runGroupId: string) =>
    Effect.gen(function* () {
      // Similar to createProgressStream, but for run groups
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();

          const connectionEvent = formatSSEEvent({
            event: "connected",
            data: { runGroupId, timestamp: new Date().toISOString() },
          });
          controller.enqueue(encoder.encode(connectionEvent));

          // TODO: Implement actual streaming logic
        },

        cancel() {
          // Cleanup
        },
      });

      return stream;
    }),

  formatEvent: <T>(event: SSEEvent<T>) => formatSSEEvent(event),

  sendEvent: <T>(runId: string, event: SSEEvent<T>) =>
    Effect.gen(function* () {
      // Stub implementation
      // TODO: Implement event broadcasting to connected clients
      // This would typically:
      // 1. Find all active SSE connections for this runId
      // 2. Send the formatted event to each connection
      // 3. Handle connection errors and cleanup

      // For now, just format the event to validate it works
      const _formatted = formatSSEEvent(event);

      // In production, this would push to a pub/sub system or
      // maintain a Map of active connections and send directly
      console.log(`[SSE] Would send event to runId ${runId}:`, event);

      return yield* Effect.succeed(undefined);
    }),
};

/**
 * SSE Service Layer
 *
 * SSEService ポートの実装を提供するレイヤー
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const sseService = yield* SSEService;
 *   const stream = yield* sseService.createProgressStream("run-123");
 *   return stream;
 * }).pipe(Effect.provide(SSEServiceLive));
 * ```
 */
export const SSEServiceLive = Layer.succeed(SSEService, SSEServiceImpl);

/**
 * Implementation Notes
 *
 * 実際の実装時の考慮事項:
 *
 * 1. Connection Management:
 *    - Map<runId, Set<WritableStreamDefaultWriter>> で接続を管理
 *    - Client disconnect時にクリーンアップ
 *    - Heartbeat (keep-alive) を定期送信
 *
 * 2. Event Broadcasting:
 *    - Option A: Database Polling
 *      - setInterval で1-5秒ごとにDBをチェック
 *      - 変更があればイベントを送信
 *      - シンプルだがスケーラビリティに制限
 *
 *    - Option B: Redis Pub/Sub (推奨)
 *      - recordTestResult use case 内で Redis PUBLISH
 *      - SSE adapter で Redis SUBSCRIBE
 *      - 複数インスタンス間で共有可能
 *      - リアルタイム性が高い
 *
 *    - Option C: In-Memory EventEmitter
 *      - Node.js EventEmitter を使用
 *      - 単一インスタンスのみ
 *      - 最もシンプル
 *
 * 3. Error Handling:
 *    - Network errors → 自動再接続 (retry フィールド)
 *    - Invalid data → エラーイベント送信
 *    - Connection timeout → クリーンアップ
 *
 * 4. Performance:
 *    - 不要なイベントを送らない（前回と同じデータなら skip）
 *    - Batch updates（短時間に複数更新がある場合）
 *    - Connection limit（同時接続数制限）
 *
 * 5. Security:
 *    - 認証: JWT トークンをクエリパラメータで渡す
 *    - 認可: runId に対するアクセス権限をチェック
 *    - Rate limiting: 同一ユーザーの接続数制限
 */
