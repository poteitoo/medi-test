import { Data } from "effect";

/**
 * Organization ドメインモデル
 *
 * 組織（会社、チーム）の情報を表現するドメインモデル
 */
export class Organization extends Data.Class<{
  /**
   * 組織ID（UUID）
   */
  readonly id: string;

  /**
   * 組織名
   */
  readonly name: string;

  /**
   * 組織スラッグ（URL用の一意識別子）
   */
  readonly slug: string;

  /**
   * 組織説明（オプション）
   */
  readonly description?: string;

  /**
   * 組織ロゴURL（オプション）
   */
  readonly logoUrl?: string;

  /**
   * 作成日時
   */
  readonly createdAt: Date;

  /**
   * 更新日時
   */
  readonly updatedAt: Date;
}> {}
