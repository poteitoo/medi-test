import { Data } from "effect";

/**
 * テストランが見つからないエラー
 */
export class TestRunNotFoundError extends Data.TaggedError(
  "TestRunNotFoundError",
)<{
  readonly message: string;
  readonly runId?: string;
}> {}

/**
 * テストランアイテムが見つからないエラー
 */
export class TestRunItemNotFoundError extends Data.TaggedError(
  "TestRunItemNotFoundError",
)<{
  readonly message: string;
  readonly itemId?: string;
}> {}

/**
 * 無効なテストランステータスエラー
 */
export class InvalidRunStatusError extends Data.TaggedError(
  "InvalidRunStatusError",
)<{
  readonly message: string;
  readonly currentStatus: string;
  readonly expectedStatus?: string;
}> {}
