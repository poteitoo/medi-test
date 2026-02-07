import { Data } from "effect";
import type { RevisionStatus } from "./revision-status";

/**
 * テストシナリオリストに含まれるシナリオの参照
 */
export class TestScenarioListItemRef extends Data.Class<{
  /**
   * テストシナリオID
   */
  readonly scenarioId: string;

  /**
   * 使用するリビジョン番号
   */
  readonly revisionNumber: number;

  /**
   * リスト内での順序
   */
  readonly order: number;
}> {}

/**
 * TestScenarioListRevision ドメインモデル
 *
 * テストシナリオリストのリビジョン（バージョン）を表現するドメインモデル
 */
export class TestScenarioListRevision extends Data.Class<{
  /**
   * リビジョンID（UUID）
   */
  readonly id: string;

  /**
   * 所属テストシナリオリストID
   */
  readonly testScenarioListId: string;

  /**
   * リビジョン番号（1から始まる連番）
   */
  readonly rev: number;

  /**
   * リビジョンのステータス
   */
  readonly status: RevisionStatus;

  /**
   * リストのタイトル
   */
  readonly title: string;

  /**
   * リストの説明
   */
  readonly description?: string;

  /**
   * 含まれるテストシナリオのリスト（順序付き）
   */
  readonly testScenarios: readonly TestScenarioListItemRef[];

  /**
   * 作成者ユーザーID
   */
  readonly createdBy: string;

  /**
   * 作成日時
   */
  readonly createdAt: Date;
}> {}
