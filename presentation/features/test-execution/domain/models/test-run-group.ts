import { Data } from "effect";
import type { RunGroupStatus } from "./run-status";

/**
 * TestRunGroup ドメインモデル
 *
 * テスト実行グループを表現するドメインモデル
 * リリースに紐づく複数のテストランをグループ化
 */
export class TestRunGroup extends Data.Class<{
  /**
   * テストランググループID（UUID）
   */
  readonly id: string;

  /**
   * リリースID
   */
  readonly releaseId: string;

  /**
   * グループ名
   */
  readonly name: string;

  /**
   * 目的（回帰テスト、ホットフィックス、環境別等）
   */
  readonly purpose: string;

  /**
   * ステータス
   */
  readonly status: RunGroupStatus;

  /**
   * 作成日時
   */
  readonly createdAt: Date;

  /**
   * 更新日時
   */
  readonly updatedAt: Date;
}> {}
