import { Data } from "effect";

/**
 * Waiver期限切れエラー
 *
 * 有効期限が切れたWaiverを使用しようとした場合のエラー
 */
export class WaiverExpiredError extends Data.TaggedError("WaiverExpiredError")<{
  readonly message: string;
  readonly waiverId: string;
  readonly expiresAt: Date;
}> {}

/**
 * Waiverが見つからないエラー
 */
export class WaiverNotFoundError extends Data.TaggedError(
  "WaiverNotFoundError",
)<{
  readonly message: string;
  readonly waiverId?: string;
}> {}

/**
 * Waiver発行権限エラー
 *
 * Waiverを発行する権限がない場合のエラー
 */
export class WaiverPermissionError extends Data.TaggedError(
  "WaiverPermissionError",
)<{
  readonly message: string;
  readonly userId: string;
}> {}
