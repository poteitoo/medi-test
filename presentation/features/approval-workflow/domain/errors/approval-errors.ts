import { Data } from "effect";

/**
 * 承認が見つからないエラー
 *
 * @description
 * 指定されたIDの承認情報が存在しない場合に発生します。
 *
 * @example
 * ```typescript
 * yield* Effect.fail(new ApprovalNotFoundError({
 *   message: "承認情報が見つかりません",
 *   approvalId: "approval-123"
 * }));
 * ```
 */
export class ApprovalNotFoundError extends Data.TaggedError(
  "ApprovalNotFoundError",
)<{
  message: string;
  approvalId?: string;
}> {}

/**
 * 既に承認済みエラー
 *
 * @description
 * 同じステップで同じユーザーが既に承認または却下している場合に発生します。
 * 二重承認を防ぐためのエラーです。
 *
 * @example
 * ```typescript
 * yield* Effect.fail(new AlreadyApprovedException({
 *   message: "このリビジョンは既に承認されています",
 *   objectId: "revision-123",
 *   approverId: "user-456",
 *   step: 1
 * }));
 * ```
 */
export class AlreadyApprovedException extends Data.TaggedError(
  "AlreadyApprovedException",
)<{
  message: string;
  objectId: string;
  approverId: string;
  step: number;
}> {}

/**
 * 承認権限不足エラー
 *
 * @description
 * ユーザーが承認・却下を行う権限を持っていない場合に発生します。
 *
 * @example
 * ```typescript
 * yield* Effect.fail(new InsufficientPermissionError({
 *   message: "承認権限がありません",
 *   userId: "user-123",
 *   requiredRole: "APPROVER"
 * }));
 * ```
 */
export class InsufficientPermissionError extends Data.TaggedError(
  "InsufficientPermissionError",
)<{
  message: string;
  userId: string;
  requiredRole?: string;
}> {}

/**
 * 承認バリデーションエラー
 *
 * @description
 * 承認データのバリデーションに失敗した場合に発生します。
 * - 却下時のコメント必須チェック
 * - 証拠リンクのURL形式チェック
 * - ステップ番号の妥当性チェック など
 *
 * @example
 * ```typescript
 * yield* Effect.fail(new ApprovalValidationError({
 *   message: "却下理由のコメントが必要です",
 *   field: "comment"
 * }));
 * ```
 */
export class ApprovalValidationError extends Data.TaggedError(
  "ApprovalValidationError",
)<{
  message: string;
  field?: string;
}> {}
