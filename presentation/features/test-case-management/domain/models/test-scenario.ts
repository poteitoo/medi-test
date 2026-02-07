import { Data } from "effect";

/**
 * TestScenario ドメインモデル
 *
 * テストシナリオ（複数のテストケースをまとめたもの）を表現するドメインモデル
 * リビジョン管理により、シナリオの履歴を保持
 */
export class TestScenario extends Data.Class<{
  /**
   * テストシナリオID（UUID）
   */
  readonly id: string;

  /**
   * 所属プロジェクトID
   */
  readonly projectId: string;

  /**
   * 作成日時
   */
  readonly createdAt: Date;

  /**
   * 更新日時
   */
  readonly updatedAt: Date;
}> {}
