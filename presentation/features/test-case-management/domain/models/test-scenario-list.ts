import { Data } from "effect";

/**
 * TestScenarioList - テストシナリオリストの基本情報
 *
 * テストシナリオリストのstable ID（不変の識別子）と基本メタデータを管理します。
 * テストシナリオリストは複数のテストシナリオをまとめたもので、リリースやスプリント単位でのテスト実行計画を表現します。
 * 実際の内容はリビジョン（TestScenarioListRevision）に保存され、履歴管理されます。
 *
 * 論理削除: deletedAtがnullでない場合、このテストシナリオリストは削除されています。
 */
export class TestScenarioList extends Data.Class<{
  /**
   * テストシナリオリストID（stable ID）
   *
   * リビジョンが変わってもこのIDは変わりません。
   * テストシナリオリストを一意に識別する永続的な識別子です。
   */
  readonly id: string;

  /**
   * 所属プロジェクトID
   *
   * このテストシナリオリストが属するプロジェクトのID
   */
  readonly projectId: string;

  /**
   * 作成日時
   *
   * このテストシナリオリストが最初に作成された日時
   */
  readonly createdAt: Date;

  /**
   * 削除日時（論理削除用）
   *
   * nullでない場合、このテストシナリオリストは削除されています
   */
  readonly deletedAt?: Date;
}> {
  /**
   * Stable IDを取得
   *
   * @returns テストシナリオリストのstable ID
   */
  getStableId(): string {
    return this.id;
  }

  /**
   * 削除されているかチェック
   *
   * @returns 削除されている場合はtrue
   */
  isDeleted(): boolean {
    return this.deletedAt !== undefined;
  }
}
