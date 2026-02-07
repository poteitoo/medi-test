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
   * 作成日時
   */
  readonly createdAt: Date;

  /**
   * 更新日時
   */
  readonly updatedAt: Date;
}> {
  /**
   * 表示名を取得
   *
   * @returns 組織の表示名（name）
   */
  getDisplayName(): string {
    return this.name;
  }

  /**
   * スラッグが有効かどうかを検証
   *
   * スラッグは小文字の英数字とハイフンのみで構成され、
   * 3文字以上32文字以下である必要がある
   *
   * @returns スラッグが有効な場合はtrue
   */
  isValidSlug(): boolean {
    const slugPattern = /^[a-z0-9-]{3,32}$/;
    return slugPattern.test(this.slug);
  }
}

/**
 * 組織作成時の入力データ
 */
export type CreateOrganizationInput = {
  /**
   * 組織名
   */
  readonly name: string;

  /**
   * 組織スラッグ（URL用の一意識別子）
   */
  readonly slug: string;
};

/**
 * 組織更新時の入力データ
 */
export type UpdateOrganizationInput = {
  /**
   * 組織名（オプション）
   */
  readonly name?: string;

  /**
   * 組織スラッグ（オプション）
   */
  readonly slug?: string;
};
