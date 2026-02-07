import { Data } from "effect";

/**
 * リリースが見つからないエラー
 */
export class ReleaseNotFoundError extends Data.TaggedError(
  "ReleaseNotFoundError",
)<{
  readonly message: string;
  readonly releaseId?: string;
}> {}
