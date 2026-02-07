import { Data } from "effect";

/**
 * TestCase ドメインモデル
 *
 * テストケースの基本情報を表現するドメインモデル
 * リビジョン管理により、テストケースの履歴を保持
 */
export class TestCase extends Data.Class<{
  /**
   * テストケースID（UUID）
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
