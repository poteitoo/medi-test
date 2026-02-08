import { Data } from "effect";

/**
 * リビジョンが不変（イミュータブル）な状態で変更を試みた場合のエラー
 *
 * 承認済み（APPROVED）またはレビュー中（IN_REVIEW）のリビジョンは
 * 編集できません。このような状態のリビジョンを変更しようとした場合に発生します。
 *
 * 編集可能なステータス:
 * - DRAFT: 下書き（編集可能）
 *
 * 編集不可のステータス:
 * - IN_REVIEW: レビュー中
 * - APPROVED: 承認済み
 * - DEPRECATED: 非推奨
 *
 * @example
 * new RevisionImmutableError({
 *   revisionId: "rev-123",
 *   status: "APPROVED"
 * })
 */
export class RevisionImmutableError extends Data.TaggedError(
  "RevisionImmutableError",
)<{
  readonly revisionId: string;
  readonly status: string;
  readonly message?: string;
}> {
  /**
   * エラーメッセージを取得
   */
  get displayMessage(): string {
    return (
      this.message ??
      `リビジョンは編集できません（${this.status}）: ${this.revisionId}`
    );
  }
}

/**
 * 既に提出済みのリビジョンを再度提出しようとした場合のエラー
 *
 * レビュー中（IN_REVIEW）または承認済み（APPROVED）のリビジョンは
 * 再提出できません。ドラフト（DRAFT）状態のリビジョンのみ提出可能です。
 *
 * 有効な提出フロー:
 * 1. ドラフト作成（DRAFT）
 * 2. レビュー提出（DRAFT → IN_REVIEW）
 * 3. 承認または差し戻し
 *
 * @example
 * new RevisionAlreadySubmittedError({ revisionId: "rev-123" })
 */
export class RevisionAlreadySubmittedError extends Data.TaggedError(
  "RevisionAlreadySubmittedError",
)<{
  readonly revisionId: string;
  readonly message?: string;
}> {
  /**
   * エラーメッセージを取得
   */
  get displayMessage(): string {
    return (
      this.message ?? `リビジョンは既に提出済みです: ${this.revisionId}`
    );
  }
}

/**
 * リビジョン作成エラー
 *
 * @example
 * new RevisionCreationError({ message: "リビジョンの作成に失敗しました" })
 */
export class RevisionCreationError extends Data.TaggedError(
  "RevisionCreationError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * リビジョン更新エラー
 *
 * @example
 * new RevisionUpdateError({ revisionId: "rev-123", message: "更新に失敗しました" })
 */
export class RevisionUpdateError extends Data.TaggedError(
  "RevisionUpdateError",
)<{
  readonly message: string;
  readonly revisionId: string;
  readonly cause?: unknown;
}> {}

/**
 * リビジョンバリデーションエラー
 *
 * @example
 * new RevisionValidationError({ message: "バリデーションエラー", errors: ["タイトルが必須です"] })
 */
export class RevisionValidationError extends Data.TaggedError(
  "RevisionValidationError",
)<{
  readonly message: string;
  readonly errors: readonly string[];
}> {}

/**
 * リビジョン番号の衝突エラー
 *
 * @example
 * new RevisionNumberConflictError({ revisionNumber: 2, message: "リビジョン番号が重複しています" })
 */
export class RevisionNumberConflictError extends Data.TaggedError(
  "RevisionNumberConflictError",
)<{
  readonly message: string;
  readonly revisionNumber: number;
}> {}
