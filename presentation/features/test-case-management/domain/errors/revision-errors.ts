import { Data } from "effect";
import type { RevisionStatus } from "../models/revision-status";

/**
 * リビジョンが不変（編集不可）であることを示すエラー
 */
export class RevisionImmutableError extends Data.TaggedError(
  "RevisionImmutableError",
)<{
  readonly message: string;
  readonly revisionId: string;
  readonly status: RevisionStatus;
}> {}

/**
 * リビジョン作成エラー
 */
export class RevisionCreationError extends Data.TaggedError(
  "RevisionCreationError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * リビジョン更新エラー
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
 */
export class RevisionValidationError extends Data.TaggedError(
  "RevisionValidationError",
)<{
  readonly message: string;
  readonly errors: readonly string[];
}> {}

/**
 * リビジョン番号の衝突エラー
 */
export class RevisionNumberConflictError extends Data.TaggedError(
  "RevisionNumberConflictError",
)<{
  readonly message: string;
  readonly revisionNumber: number;
}> {}
