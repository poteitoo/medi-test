/**
 * リビジョンのステータス
 * Prisma schema.prismaのRevisionStatusと一致
 */
export type RevisionStatus =
  | "DRAFT" // 下書き
  | "IN_REVIEW" // レビュー中
  | "APPROVED" // 承認済み
  | "DEPRECATED"; // 非推奨

/**
 * リビジョンステータスの表示名マッピング
 */
export const REVISION_STATUS_LABELS: Record<RevisionStatus, string> = {
  DRAFT: "下書き",
  IN_REVIEW: "レビュー中",
  APPROVED: "承認済み",
  DEPRECATED: "非推奨",
};

/**
 * ステータス遷移の検証
 *
 * 特定のステータスから別のステータスへの遷移が可能かを判定
 */
export const canTransitionTo = (
  from: RevisionStatus,
  to: RevisionStatus,
): boolean => {
  const allowedTransitions: Record<RevisionStatus, RevisionStatus[]> = {
    DRAFT: ["IN_REVIEW", "DEPRECATED"],
    IN_REVIEW: ["APPROVED", "DEPRECATED", "DRAFT"],
    APPROVED: ["DEPRECATED"],
    DEPRECATED: ["DRAFT"],
  };

  return allowedTransitions[from].includes(to);
};

/**
 * ステータスが編集可能かを判定
 *
 * 下書きと非推奨は編集可能（却下後に修正できるようにするため）
 */
export const isEditable = (status: RevisionStatus): boolean => {
  return status === "DRAFT" || status === "DEPRECATED";
};

/**
 * ステータスが承認可能かを判定
 *
 * レビュー中のステータスのみ承認可能
 */
export const isApprovable = (status: RevisionStatus): boolean => {
  return status === "IN_REVIEW";
};

/**
 * ステータスが最終状態かを判定
 *
 * 承認済みまたは非推奨は最終状態
 */
export const isFinalStatus = (status: RevisionStatus): boolean => {
  return status === "APPROVED" || status === "DEPRECATED";
};
