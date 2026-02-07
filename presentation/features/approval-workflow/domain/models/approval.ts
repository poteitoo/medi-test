import { Data } from "effect";

/**
 * 承認決定（Prisma schema: ApprovalDecision）
 */
export type ApprovalAction = "APPROVED" | "REJECTED";

/**
 * 承認オブジェクトのタイプ（Prisma schema: ApprovalObjectType）
 */
export type ApprovalObjectType =
  | "CASE_REVISION"
  | "SCENARIO_REVISION"
  | "LIST_REVISION"
  | "MAPPING_REVISION"
  | "WORKFLOW_REVISION"
  | "RELEASE"
  | "WAIVER";

/**
 * Approval ドメインモデル
 *
 * リビジョンやリリースの承認情報を表現するドメインモデル
 */
export class Approval extends Data.Class<{
  /**
   * 承認ID（UUID）
   */
  readonly id: string;

  /**
   * 承認対象のオブジェクトID
   */
  readonly objectId: string;

  /**
   * 承認対象のオブジェクトタイプ
   */
  readonly objectType: ApprovalObjectType;

  /**
   * 承認ステップ番号
   */
  readonly step: number;

  /**
   * 承認者ユーザーID
   */
  readonly approverId: string;

  /**
   * 承認決定
   */
  readonly decision: ApprovalAction;

  /**
   * コメント（オプション）
   */
  readonly comment?: string;

  /**
   * 承認日時
   */
  readonly timestamp: Date;
}> {}

/**
 * 承認が必要かチェック
 */
export const requiresApproval = (objectType: ApprovalObjectType): boolean => {
  // すべてのリビジョンとリリースは承認が必要
  return true;
};

/**
 * 承認アクションの表示名
 */
export const APPROVAL_ACTION_LABELS: Record<ApprovalAction, string> = {
  APPROVED: "承認",
  REJECTED: "却下",
};

/**
 * 承認オブジェクトタイプの表示名
 */
export const APPROVAL_OBJECT_TYPE_LABELS: Record<ApprovalObjectType, string> = {
  CASE_REVISION: "テストケース",
  SCENARIO_REVISION: "テストシナリオ",
  LIST_REVISION: "テストシナリオリスト",
  MAPPING_REVISION: "マッピング",
  WORKFLOW_REVISION: "ワークフロー",
  RELEASE: "リリース",
  WAIVER: "適用除外",
};
