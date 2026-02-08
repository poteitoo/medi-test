import { Data } from "effect";

/**
 * Project ドメインモデル
 *
 * プロジェクトの情報を表現するドメインモデル
 */
export class Project extends Data.Class<{
  /**
   * プロジェクトID（UUID）
   */
  readonly id: string;

  /**
   * 所属組織ID
   */
  readonly organizationId: string;

  /**
   * 組織スラッグ（オプション、getFullSlugで使用）
   */
  readonly organizationSlug?: string;

  /**
   * プロジェクト名
   */
  readonly name: string;

  /**
   * プロジェクトスラッグ（URL用の一意識別子）
   */
  readonly slug: string;

  /**
   * プロジェクト説明（オプション）
   */
  readonly description?: string;

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
   * @returns プロジェクトの表示名（name）
   */
  getDisplayName(): string {
    return this.name;
  }

  /**
   * 完全なスラッグを取得
   *
   * 組織スラッグとプロジェクトスラッグを組み合わせたフルパス
   * （例: "acme-corp/web-app"）
   *
   * @param organizationSlug - 組織スラッグ
   * @returns 完全なスラッグ
   */
  getFullSlug(organizationSlug?: string): string {
    const orgSlug = organizationSlug ?? this.organizationSlug;
    if (orgSlug) {
      return `${orgSlug}/${this.slug}`;
    }
    return this.slug;
  }
}

/**
 * プロジェクト作成時の入力データ
 */
export type CreateProjectInput = {
  /**
   * 所属組織ID
   */
  readonly organizationId: string;

  /**
   * プロジェクト名
   */
  readonly name: string;

  /**
   * プロジェクトスラッグ（URL用の一意識別子）
   */
  readonly slug: string;

  /**
   * プロジェクト説明（オプション）
   */
  readonly description?: string;
};

/**
 * プロジェクト更新時の入力データ
 */
export type UpdateProjectInput = {
  /**
   * プロジェクト名（オプション）
   */
  readonly name?: string;

  /**
   * プロジェクトスラッグ（オプション）
   */
  readonly slug?: string;

  /**
   * プロジェクト説明（オプション）
   */
  readonly description?: string;
};
