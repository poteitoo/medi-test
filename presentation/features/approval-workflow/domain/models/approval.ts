import { Data } from "effect";

/**
 * 承認決定（Prisma schema: ApprovalDecision）
 */
export type ApprovalAction = "APPROVED" | "REJECTED";

/**
 * 承認決定（enum形式）
 *
 * @description
 * 承認者が下す決定の種類を定義します。
 *
 * - APPROVED: 承認
 * - REJECTED: 却下
 */
export enum ApprovalDecision {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

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
 * 証拠リンク
 *
 * @description
 * 承認決定の根拠となる証拠リンクを表します。
 *
 * @property url - リンクURL
 * @property title - リンクタイトル
 */
export interface EvidenceLink {
  url: string;
  title: string;
}

/**
 * Approval ドメインモデル
 *
 * @description
 * テストケース、シナリオ、リリースなどの承認を表すドメインモデルです。
 * 多段階承認をサポートし、各ステップでの承認者、決定、コメント、証拠リンクを記録します。
 *
 * @example
 * ```typescript
 * const approval = new Approval({
 *   id: "approval-1",
 *   objectType: "CASE_REVISION",
 *   objectId: "revision-123",
 *   step: 1,
 *   decision: "APPROVED",
 *   approverId: "user-456",
 *   comment: "問題なし",
 *   evidenceLinks: [{ url: "https://example.com/test", title: "テスト結果" }],
 *   timestamp: new Date("2026-02-08T10:00:00Z"),
 * });
 *
 * console.log(approval.isApproved()); // true
 * console.log(approval.getDisplayDecision()); // "承認"
 * ```
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
   * 証拠リンク配列（オプション）
   */
  readonly evidenceLinks?: EvidenceLink[];

  /**
   * 承認日時
   */
  readonly timestamp: Date;
}> {
  /**
   * 承認されているかどうかを判定
   *
   * @returns 承認の場合true
   */
  isApproved(): boolean {
    return this.decision === "APPROVED";
  }

  /**
   * 却下されているかどうかを判定
   *
   * @returns 却下の場合true
   */
  isRejected(): boolean {
    return this.decision === "REJECTED";
  }

  /**
   * 証拠リンクが存在するかどうかを判定
   *
   * @returns 証拠リンクがある場合true
   */
  hasEvidence(): boolean {
    return this.evidenceLinks !== undefined && this.evidenceLinks.length > 0;
  }

  /**
   * 表示用の承認決定テキストを取得
   *
   * @returns 日本語の決定テキスト
   */
  getDisplayDecision(): string {
    return this.isApproved() ? "承認" : "却下";
  }
}

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
