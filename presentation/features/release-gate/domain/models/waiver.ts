import { Data } from "effect";

/**
 * Waiver対象タイプ（Prisma schema: WaiverTargetType）
 */
export type WaiverTargetType =
  | "FAIL_RESULT"
  | "UNAPPROVED_REVISION"
  | "UNEXECUTED_TEST"
  | "OTHER";

/**
 * Waiver ドメインモデル
 *
 * ゲート条件違反の適用除外を表現するドメインモデル
 * リリース承認をブロックする違反に対して、正当な理由で例外を認める
 */
export class Waiver extends Data.Class<{
  /**
   * WaiverID（UUID）
   */
  readonly id: string;

  /**
   * リリースID
   */
  readonly releaseId: string;

  /**
   * 適用除外対象のタイプ
   */
  readonly targetType: WaiverTargetType;

  /**
   * 適用除外対象のID（TestResult ID、Revision ID等）
   */
  readonly targetId?: string;

  /**
   * 適用除外の理由（必須）
   */
  readonly reason: string;

  /**
   * 有効期限
   */
  readonly expiresAt: Date;

  /**
   * 発行者ユーザーID
   */
  readonly issuerId: string;

  /**
   * 発行日時
   */
  readonly createdAt: Date;
}> {}

/**
 * Waiver対象タイプの表示名
 */
export const WAIVER_TARGET_TYPE_LABELS: Record<WaiverTargetType, string> = {
  FAIL_RESULT: "テスト失敗",
  UNAPPROVED_REVISION: "未承認リビジョン",
  UNEXECUTED_TEST: "未実行テスト",
  OTHER: "その他",
};

/**
 * Waiverが有効期限切れかチェック
 */
export const isExpired = (waiver: Waiver, now: Date = new Date()): boolean => {
  return waiver.expiresAt < now;
};

/**
 * Waiverが有効かチェック
 */
export const isValid = (waiver: Waiver, now: Date = new Date()): boolean => {
  return !isExpired(waiver, now);
};
