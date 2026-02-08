import { Data } from "effect";

/**
 * TestScenario - テストシナリオの基本情報
 *
 * テストシナリオのstable ID（不変の識別子）と基本メタデータを管理します。
 * テストシナリオは複数のテストケースをまとめたもので、一連のテストフローを表現します。
 * 実際の内容はリビジョン（TestScenarioRevision）に保存され、履歴管理されます。
 *
 * 論理削除: deletedAtがnullでない場合、このテストシナリオは削除されています。
 */
export class TestScenario extends Data.Class<{
  /**
   * テストシナリオID（stable ID）
   *
   * リビジョンが変わってもこのIDは変わりません。
   * テストシナリオを一意に識別する永続的な識別子です。
   */
  readonly id: string;

  /**
   * 所属プロジェクトID
   *
   * このテストシナリオが属するプロジェクトのID
   */
  readonly projectId: string;

  /**
   * 作成日時
   *
   * このテストシナリオが最初に作成された日時
   */
  readonly createdAt: Date;

  /**
   * 削除日時（論理削除用）
   *
   * nullでない場合、このテストシナリオは削除されています
   */
  readonly deletedAt?: Date;
}> {
  /**
   * Stable IDを取得
   *
   * @returns テストシナリオのstable ID
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
