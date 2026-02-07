import { Data } from "effect";

/**
 * TestScenarioList ドメインモデル
 *
 * テストシナリオのリスト（複数のシナリオをまとめたもの）を表現するドメインモデル
 * リビジョン管理により、リストの履歴を保持
 */
export class TestScenarioList extends Data.Class<{
  /**
   * テストシナリオリストID（UUID）
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
}> {}
