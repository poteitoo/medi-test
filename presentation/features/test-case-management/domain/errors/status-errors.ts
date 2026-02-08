import { Data } from "effect";

/**
 * 無効なステータス遷移を試みた場合のエラー
 *
 * 有効なステータス遷移:
 * - DRAFT → IN_REVIEW: ドラフトをレビューに提出
 * - DRAFT → APPROVED: ドラフトから直接承認（緊急時）
 * - IN_REVIEW → APPROVED: レビュー承認
 * - IN_REVIEW → DRAFT: レビュー差し戻し（修正依頼）
 * - APPROVED → DEPRECATED: 承認済みを非推奨に変更
 *
 * 無効な遷移例:
 * - DEPRECATED → *: 非推奨からの遷移は不可（新リビジョン作成が必要）
 * - APPROVED → IN_REVIEW: 承認済みからレビュー中への戻しは不可
 * - 同一ステータスへの遷移は不可
 *
 * @example
 * new InvalidStatusTransitionError({
 *   from: "APPROVED",
 *   to: "IN_REVIEW"
 * })
 */
export class InvalidStatusTransitionError extends Data.TaggedError(
  "InvalidStatusTransitionError",
)<{
  readonly from: string;
  readonly to: string;
  readonly message?: string;
}> {
  /**
   * エラーメッセージを取得
   */
  get displayMessage(): string {
    return (
      this.message ?? `無効なステータス遷移です: ${this.from} → ${this.to}`
    );
  }
}

/**
 * ステータスのバリデーションエラー
 *
 * 不正なステータス値が指定された場合や、ステータス変更の前提条件が
 * 満たされていない場合に発生します。
 *
 * 発生する状況:
 * - サポートされていないステータス値を指定した場合
 * - 必須フィールドが不足している状態でステータス変更を試みた場合
 * - ビジネスルールに違反するステータス変更を試みた場合
 *
 * @example
 * new StatusValidationError({
 *   status: "UNKNOWN_STATUS",
 *   reason: "サポートされていないステータスです"
 * })
 *
 * @example
 * new StatusValidationError({
 *   status: "APPROVED",
 *   reason: "承認者が指定されていません"
 * })
 */
export class StatusValidationError extends Data.TaggedError(
  "StatusValidationError",
)<{
  readonly status: string;
  readonly reason: string;
  readonly message?: string;
}> {
  /**
   * エラーメッセージを取得
   */
  get displayMessage(): string {
    return (
      this.message ??
      `ステータスのバリデーションエラー: ${this.status} - ${this.reason}`
    );
  }
}

/**
 * ステータス変更権限エラー
 *
 * @example
 * new StatusChangePermissionError({ userId: "user-123", requiredStatus: "APPROVED", message: "権限がありません" })
 */
export class StatusChangePermissionError extends Data.TaggedError(
  "StatusChangePermissionError",
)<{
  readonly message: string;
  readonly userId: string;
  readonly requiredStatus: string;
}> {}

/**
 * 承認不可エラー
 *
 * @example
 * new NotApprovableError({ currentStatus: "DRAFT", message: "承認できません" })
 */
export class NotApprovableError extends Data.TaggedError("NotApprovableError")<{
  readonly message: string;
  readonly currentStatus: string;
}> {}

/**
 * 却下不可エラー
 *
 * @example
 * new NotRejectableError({ currentStatus: "DRAFT", message: "却下できません" })
 */
export class NotRejectableError extends Data.TaggedError("NotRejectableError")<{
  readonly message: string;
  readonly currentStatus: string;
}> {}
