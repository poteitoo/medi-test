import { Data } from "effect";

/**
 * 承認アクション
 */
export type ApprovalAction = "APPROVE" | "REJECT";

/**
 * 承認オブジェクトのタイプ
 */
export type ApprovalObjectType =
  | "TEST_CASE_REVISION"
  | "TEST_SCENARIO_REVISION"
  | "TEST_SCENARIO_LIST_REVISION"
  | "RELEASE";

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
   * 承認者ユーザーID
   */
  readonly approverId: string;

  /**
   * 承認アクション
   */
  readonly action: ApprovalAction;

  /**
   * コメント（オプション）
   */
  readonly comment?: string;

  /**
   * 承認日時
   */
  readonly createdAt: Date;
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
  APPROVE: "承認",
  REJECT: "却下",
};

/**
 * 承認オブジェクトタイプの表示名
 */
export const APPROVAL_OBJECT_TYPE_LABELS: Record<
  ApprovalObjectType,
  string
> = {
  TEST_CASE_REVISION: "テストケース",
  TEST_SCENARIO_REVISION: "テストシナリオ",
  TEST_SCENARIO_LIST_REVISION: "テストシナリオリスト",
  RELEASE: "リリース",
};
