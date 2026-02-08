import { Data } from "effect";

/**
 * エビデンスが必須エラー
 *
 * FAIL or BLOCKED ステータスの場合にエビデンスが必要な場合に使用
 */
export class EvidenceRequiredError extends Data.TaggedError(
  "EvidenceRequiredError",
)<{
  readonly message: string;
  readonly status: "FAIL" | "BLOCKED";
  readonly itemId?: string;
}> {}

/**
 * エビデンスファイルサイズエラー
 */
export class EvidenceFileSizeError extends Data.TaggedError(
  "EvidenceFileSizeError",
)<{
  readonly message: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly maxSize: number;
}> {}

/**
 * エビデンスファイルタイプエラー
 */
export class EvidenceFileTypeError extends Data.TaggedError(
  "EvidenceFileTypeError",
)<{
  readonly message: string;
  readonly fileName: string;
  readonly fileType: string;
  readonly allowedTypes: readonly string[];
}> {}

/**
 * エビデンスアップロードエラー
 */
export class EvidenceUploadError extends Data.TaggedError(
  "EvidenceUploadError",
)<{
  readonly message: string;
  readonly fileName: string;
  readonly cause?: Error;
}> {}
