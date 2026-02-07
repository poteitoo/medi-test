import { Data } from "effect";
import type { GateViolation } from "../models/gate-violation";

/**
 * ゲート条件違反エラー
 *
 * リリース承認がブロックされるゲート条件違反が存在する場合のエラー
 */
export class GateViolationError extends Data.TaggedError("GateViolationError")<{
  readonly message: string;
  readonly violations: readonly GateViolation[];
  readonly releaseId?: string;
}> {}

/**
 * 無効なリリースステータスエラー
 *
 * 現在のリリースステータスでは実行できない操作を試みた場合のエラー
 */
export class InvalidReleaseStatusError extends Data.TaggedError(
  "InvalidReleaseStatusError",
)<{
  readonly message: string;
  readonly currentStatus: string;
  readonly expectedStatus?: string;
}> {}
