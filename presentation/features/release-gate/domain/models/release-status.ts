/**
 * リリースステータス（Prisma schema: ReleaseStatus）
 */
export type ReleaseStatus =
  | "PLANNING"
  | "EXECUTING"
  | "GATE_CHECK"
  | "APPROVED_FOR_RELEASE"
  | "RELEASED";

/**
 * リリースステータスの表示名
 */
export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  PLANNING: "計画中",
  EXECUTING: "実行中",
  GATE_CHECK: "ゲート評価中",
  APPROVED_FOR_RELEASE: "リリース承認済み",
  RELEASED: "リリース完了",
};

/**
 * ステータス遷移が可能かチェック
 */
export const canTransitionTo = (
  from: ReleaseStatus,
  to: ReleaseStatus,
): boolean => {
  const allowedTransitions: Record<ReleaseStatus, ReleaseStatus[]> = {
    PLANNING: ["EXECUTING", "RELEASED"], // 計画中→実行開始 or キャンセル
    EXECUTING: ["GATE_CHECK", "PLANNING"], // 実行中→評価 or 計画に戻す
    GATE_CHECK: ["APPROVED_FOR_RELEASE", "EXECUTING"], // 評価→承認 or 実行に戻す
    APPROVED_FOR_RELEASE: ["RELEASED", "GATE_CHECK"], // 承認→リリース or 再評価
    RELEASED: [], // リリース完了後は変更不可
  };

  return allowedTransitions[from].includes(to);
};

/**
 * リリース承認が可能なステータスかチェック
 */
export const isApprovable = (status: ReleaseStatus): boolean => {
  return status === "GATE_CHECK";
};

/**
 * ゲート評価が可能なステータスかチェック
 */
export const isEvaluatable = (status: ReleaseStatus): boolean => {
  return status === "EXECUTING" || status === "GATE_CHECK";
};
