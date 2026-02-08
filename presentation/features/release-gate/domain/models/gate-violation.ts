import { Data } from "effect";
import type { GateConditionType } from "./gate-condition";

/**
 * 違反の重要度
 */
export type ViolationSeverity = "CRITICAL" | "WARNING" | "INFO";

/**
 * GateViolation ドメインモデル
 *
 * ゲート条件の違反を表現するドメインモデル
 * リリース承認をブロックする条件違反の詳細を記録
 */
export class GateViolation extends Data.Class<{
  /**
   * 違反したゲート条件タイプ
   */
  readonly conditionType: GateConditionType;

  /**
   * 違反の重要度
   */
  readonly severity: ViolationSeverity;

  /**
   * 違反メッセージ
   */
  readonly message: string;

  /**
   * 詳細情報（実測値、期待値等）
   */
  readonly details?: {
    readonly expected?: number | string;
    readonly actual?: number | string;
    readonly affectedIds?: readonly string[];
  };

  /**
   * 違反を解決するための推奨アクション
   */
  readonly suggestedAction?: string;

  /**
   * この違反にWaiverが発行されているかどうか
   */
  readonly hasWaiver?: boolean;

  /**
   * WaiverのID（存在する場合）
   */
  readonly waiverId?: string;
}> {}

/**
 * 違反の重要度ラベル
 */
export const VIOLATION_SEVERITY_LABELS: Record<ViolationSeverity, string> = {
  CRITICAL: "致命的",
  WARNING: "警告",
  INFO: "情報",
};

/**
 * 違反がリリースをブロックするかチェック
 */
export const isBlocking = (violation: GateViolation): boolean => {
  return violation.severity === "CRITICAL" && !violation.hasWaiver;
};

/**
 * 違反リストに未解決のブロッキング違反があるかチェック
 */
export const hasBlockingViolations = (
  violations: readonly GateViolation[],
): boolean => {
  return violations.some(isBlocking);
};
