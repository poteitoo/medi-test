import { Data } from "effect";
import type { RevisionStatus } from "../models/revision-status";

/**
 * 無効なステータス遷移エラー
 */
export class InvalidStatusTransitionError extends Data.TaggedError(
  "InvalidStatusTransitionError",
)<{
  readonly message: string;
  readonly from: RevisionStatus;
  readonly to: RevisionStatus;
}> {}

/**
 * ステータス変更権限エラー
 */
export class StatusChangePermissionError extends Data.TaggedError(
  "StatusChangePermissionError",
)<{
  readonly message: string;
  readonly userId: string;
  readonly requiredStatus: RevisionStatus;
}> {}

/**
 * 承認不可エラー
 */
export class NotApprovableError extends Data.TaggedError("NotApprovableError")<{
  readonly message: string;
  readonly currentStatus: RevisionStatus;
}> {}

/**
 * 却下不可エラー
 */
export class NotRejectableError extends Data.TaggedError("NotRejectableError")<{
  readonly message: string;
  readonly currentStatus: RevisionStatus;
}> {}
