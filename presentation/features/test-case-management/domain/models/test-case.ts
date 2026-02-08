import { Data } from "effect";

/**
 * TestCase - テストケースの基本情報
 *
 * テストケースのstable ID（不変の識別子）と基本メタデータを管理します。
 * 実際の内容はリビジョン（TestCaseRevision）に保存され、履歴管理されます。
 *
 * 論理削除: deletedAtがnullでない場合、このテストケースは削除されています。
 */
export class TestCase extends Data.Class<{
  /**
   * テストケースID（stable ID）
   *
   * リビジョンが変わってもこのIDは変わりません。
   * テストケースを一意に識別する永続的な識別子です。
   */
  readonly id: string;

  /**
   * 所属プロジェクトID
   *
   * このテストケースが属するプロジェクトのID
   */
  readonly projectId: string;

  /**
   * 作成日時
   *
   * このテストケースが最初に作成された日時
   */
  readonly createdAt: Date;

  /**
   * 削除日時（論理削除用）
   *
   * nullでない場合、このテストケースは削除されています
   */
  readonly deletedAt?: Date;
}> {
  /**
   * Stable IDを取得
   *
   * @returns テストケースのstable ID
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
