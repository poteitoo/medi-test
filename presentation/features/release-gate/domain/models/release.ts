import { Data } from "effect";
import type { ReleaseStatus } from "./release-status";

/**
 * Release ドメインモデル
 *
 * リリースを表現するドメインモデル
 * テスト実行グループをまとめ、ゲート条件を評価して承認判定を行う
 */
export class Release extends Data.Class<{
  /**
   * リリースID（UUID）
   */
  readonly id: string;

  /**
   * プロジェクトID
   */
  readonly projectId: string;

  /**
   * リリース名
   */
  readonly name: string;

  /**
   * リリース説明
   */
  readonly description?: string;

  /**
   * リリースステータス
   */
  readonly status: ReleaseStatus;

  /**
   * ビルド参照（Git SHA、CIビルド番号等）
   */
  readonly buildRef?: string;

  /**
   * 作成日時
   */
  readonly createdAt: Date;

  /**
   * 更新日時
   */
  readonly updatedAt: Date;
}> {}
