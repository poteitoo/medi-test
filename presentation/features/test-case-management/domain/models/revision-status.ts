/**
 * リビジョンのステータス
 */
export type RevisionStatus =
  | "DRAFT" // 下書き
  | "PENDING_APPROVAL" // 承認待ち
  | "APPROVED" // 承認済み
  | "REJECTED" // 却下
  | "ARCHIVED"; // アーカイブ

/**
 * リビジョンステータスの表示名マッピング
 */
export const REVISION_STATUS_LABELS: Record<RevisionStatus, string> = {
  DRAFT: "下書き",
  PENDING_APPROVAL: "承認待ち",
  APPROVED: "承認済み",
  REJECTED: "却下",
  ARCHIVED: "アーカイブ",
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
    DRAFT: ["PENDING_APPROVAL", "ARCHIVED"],
    PENDING_APPROVAL: ["APPROVED", "REJECTED", "DRAFT"],
    APPROVED: ["ARCHIVED"],
    REJECTED: ["DRAFT", "ARCHIVED"],
    ARCHIVED: [],
  };

  return allowedTransitions[from].includes(to);
};

/**
 * ステータスが編集可能かを判定
 *
 * 下書きと却下されたリビジョンのみ編集可能
 */
export const isEditable = (status: RevisionStatus): boolean => {
  return status === "DRAFT" || status === "REJECTED";
};

/**
 * ステータスが承認可能かを判定
 *
 * 承認待ちステータスのみ承認可能
 */
export const isApprovable = (status: RevisionStatus): boolean => {
  return status === "PENDING_APPROVAL";
};

/**
 * ステータスが最終状態かを判定
 *
 * 承認済みまたはアーカイブは最終状態
 */
export const isFinalStatus = (status: RevisionStatus): boolean => {
  return status === "APPROVED" || status === "ARCHIVED";
};
