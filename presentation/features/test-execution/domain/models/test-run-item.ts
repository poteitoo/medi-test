import { Data } from "effect";

/**
 * TestRunItem ドメインモデル
 *
 * テストラン内の個別テストケースを表現するドメインモデル
 * テストシナリオリストから自動生成される
 */
export class TestRunItem extends Data.Class<{
  /**
   * テストランアイテムID（UUID）
   */
  readonly id: string;

  /**
   * テストランID
   */
  readonly runId: string;

  /**
   * テストケースリビジョンID
   */
  readonly caseRevisionId: string;

  /**
   * 由来シナリオリビジョンID（オプション）
   */
  readonly originScenarioRevisionId?: string;

  /**
   * 実行順序
   */
  readonly order: number;

  /**
   * 作成日時
   */
  readonly createdAt: Date;
}> {}
