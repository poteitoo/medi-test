/**
 * テスト結果ステータス（Prisma schema: ResultStatus）
 */
export type ResultStatus = "PASS" | "FAIL" | "BLOCKED" | "SKIPPED";

/**
 * テスト結果ステータスの表示名
 */
export const RESULT_STATUS_LABELS: Record<ResultStatus, string> = {
  PASS: "合格",
  FAIL: "不合格",
  BLOCKED: "ブロック",
  SKIPPED: "スキップ",
};

/**
 * テスト結果ステータスの色分け
 */
export const RESULT_STATUS_VARIANTS = {
  PASS: "default" as const,
  FAIL: "destructive" as const,
  BLOCKED: "secondary" as const,
  SKIPPED: "outline" as const,
};

/**
 * 結果が成功とみなされるかチェック
 */
export const isSuccess = (status: ResultStatus): boolean => {
  return status === "PASS";
};

/**
 * 結果が失敗とみなされるかチェック
 */
export const isFailure = (status: ResultStatus): boolean => {
  return status === "FAIL" || status === "BLOCKED";
};
