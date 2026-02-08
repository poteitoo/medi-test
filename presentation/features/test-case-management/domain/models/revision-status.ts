/**
 * テストケース・シナリオ・シナリオリストのリビジョンステータス
 *
 * リビジョンのライフサイクルを管理し、編集可能性と状態遷移を制御します。
 */

/**
 * リビジョンステータス
 *
 * - DRAFT: 下書き（編集可能）
 * - IN_REVIEW: レビュー中（編集不可）
 * - APPROVED: 承認済み（編集不可、本番利用可能）
 * - DEPRECATED: 非推奨（編集不可、表示のみ）
 */
export const RevisionStatus = {
  DRAFT: "DRAFT",
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  DEPRECATED: "DEPRECATED",
} as const;

export type RevisionStatus =
  (typeof RevisionStatus)[keyof typeof RevisionStatus];

/**
 * リビジョンステータスの日本語ラベル
 */
export const RevisionStatusLabels: Record<RevisionStatus, string> = {
  [RevisionStatus.DRAFT]: "下書き",
  [RevisionStatus.IN_REVIEW]: "レビュー中",
  [RevisionStatus.APPROVED]: "承認済み",
  [RevisionStatus.DEPRECATED]: "非推奨",
};

/**
 * リビジョンステータスの説明
 */
export const RevisionStatusDescriptions: Record<RevisionStatus, string> = {
  [RevisionStatus.DRAFT]: "編集可能な下書き状態です",
  [RevisionStatus.IN_REVIEW]: "レビュー待ちの状態です（編集不可）",
  [RevisionStatus.APPROVED]: "承認済みで本番利用可能です（編集不可）",
  [RevisionStatus.DEPRECATED]: "非推奨となり使用できません（表示のみ）",
};

/**
 * リビジョンが編集可能かどうかを判定
 *
 * @param status - リビジョンステータス
 * @returns 編集可能な場合はtrue
 */
export const isEditable = (status: RevisionStatus): boolean => {
  return status === RevisionStatus.DRAFT;
};

/**
 * リビジョンステータスの遷移が可能かどうかを判定
 *
 * 許可される遷移:
 * - DRAFT → IN_REVIEW
 * - DRAFT → APPROVED (直接承認)
 * - IN_REVIEW → APPROVED
 * - IN_REVIEW → DRAFT (差し戻し)
 * - APPROVED → DEPRECATED
 *
 * @param from - 現在のステータス
 * @param to - 遷移先のステータス
 * @returns 遷移可能な場合はtrue
 */
export const canTransitionTo = (
  from: RevisionStatus,
  to: RevisionStatus,
): boolean => {
  // 同じステータスへの遷移は不可
  if (from === to) {
    return false;
  }

  switch (from) {
    case RevisionStatus.DRAFT:
      return to === RevisionStatus.IN_REVIEW || to === RevisionStatus.APPROVED;

    case RevisionStatus.IN_REVIEW:
      return to === RevisionStatus.APPROVED || to === RevisionStatus.DRAFT;

    case RevisionStatus.APPROVED:
      return to === RevisionStatus.DEPRECATED;

    case RevisionStatus.DEPRECATED:
      // 非推奨からの遷移は不可（新規リビジョンを作成する）
      return false;

    default:
      return false;
  }
};

/**
 * リビジョンステータスの遷移先候補を取得
 *
 * @param from - 現在のステータス
 * @returns 遷移可能なステータスの配列
 */
export const getAvailableTransitions = (
  from: RevisionStatus,
): RevisionStatus[] => {
  return Object.values(RevisionStatus).filter((to) => canTransitionTo(from, to));
};

/**
 * ステータスが承認可能かを判定
 *
 * @param status - リビジョンステータス
 * @returns レビュー中の場合はtrue
 */
export const isApprovable = (status: RevisionStatus): boolean => {
  return status === RevisionStatus.IN_REVIEW;
};

/**
 * ステータスが最終状態かを判定
 *
 * @param status - リビジョンステータス
 * @returns 承認済みまたは非推奨の場合はtrue
 */
export const isFinalStatus = (status: RevisionStatus): boolean => {
  return (
    status === RevisionStatus.APPROVED || status === RevisionStatus.DEPRECATED
  );
};

/**
 * リビジョンステータスのバッジカラーを取得（Tailwind CSS用）
 *
 * @param status - リビジョンステータス
 * @returns Tailwind CSSのカラークラス
 */
export const getStatusBadgeColor = (status: RevisionStatus): string => {
  switch (status) {
    case RevisionStatus.DRAFT:
      return "bg-gray-100 text-gray-800";
    case RevisionStatus.IN_REVIEW:
      return "bg-blue-100 text-blue-800";
    case RevisionStatus.APPROVED:
      return "bg-green-100 text-green-800";
    case RevisionStatus.DEPRECATED:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
