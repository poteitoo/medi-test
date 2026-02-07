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
}> {}
