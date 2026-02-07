import { Data } from "effect";
import type { RunStatus } from "./run-status";

/**
 * TestRun ドメインモデル
 *
 * テスト実行を表現するドメインモデル
 * テストシナリオリストから生成され、担当者に割り当てられる
 */
export class TestRun extends Data.Class<{
  /**
   * テストランID（UUID）
   */
  readonly id: string;

  /**
   * テストラングループID
   */
  readonly runGroupId: string;

  /**
   * 担当者ユーザーID
   */
  readonly assigneeUserId: string;

  /**
   * ソーステストシナリオリストリビジョンID
   */
  readonly sourceListRevisionId: string;

  /**
   * ビルド参照（テスト対象のビルド）
   */
  readonly buildRef?: string;

  /**
   * ステータス
   */
  readonly status: RunStatus;

  /**
   * 作成日時
   */
  readonly createdAt: Date;

  /**
   * 更新日時
   */
  readonly updatedAt: Date;
}> {}
