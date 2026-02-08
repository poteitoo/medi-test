/**
 * テストラン実行ステータス（Prisma schema: RunStatus）
 */
export type RunStatus = "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";

/**
 * テストランステータスの表示名
 */
export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  ASSIGNED: "割り当て済み",
  IN_PROGRESS: "実行中",
  COMPLETED: "完了",
};

/**
 * ステータス遷移が可能かチェック
 */
export const canTransitionTo = (from: RunStatus, to: RunStatus): boolean => {
  const allowedTransitions: Record<RunStatus, RunStatus[]> = {
    ASSIGNED: ["IN_PROGRESS"],
    IN_PROGRESS: ["COMPLETED", "ASSIGNED"], // 中断して戻す場合
    COMPLETED: [], // 完了後は変更不可
  };

  return allowedTransitions[from].includes(to);
};

/**
 * テストラングループステータス（Prisma schema: RunGroupStatus）
 */
export type RunGroupStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

/**
 * テストラングループステータスの表示名
 */
export const RUN_GROUP_STATUS_LABELS: Record<RunGroupStatus, string> = {
  NOT_STARTED: "未開始",
  IN_PROGRESS: "実行中",
  COMPLETED: "完了",
};
