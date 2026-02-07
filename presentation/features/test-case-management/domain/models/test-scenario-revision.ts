import { Data } from "effect";
import type { RevisionStatus } from "./revision-status";

/**
 * テストシナリオに含まれるテストケースの参照
 */
export class TestScenarioCaseRef extends Data.Class<{
  /**
   * テストケースID
   */
  readonly caseId: string;

  /**
   * 使用するリビジョン番号
   */
  readonly revisionNumber: number;

  /**
   * シナリオ内での実行順序
   */
  readonly order: number;
}> {}

/**
 * TestScenarioRevision ドメインモデル
 *
 * テストシナリオのリビジョン（バージョン）を表現するドメインモデル
 */
export class TestScenarioRevision extends Data.Class<{
  /**
   * リビジョンID（UUID）
   */
  readonly id: string;

  /**
   * 所属テストシナリオID
   */
  readonly testScenarioId: string;

  /**
   * リビジョン番号（1から始まる連番）
   */
  readonly rev: number;

  /**
   * リビジョンのステータス
   */
  readonly status: RevisionStatus;

  /**
   * シナリオのタイトル
   */
  readonly title: string;

  /**
   * シナリオの説明
   */
  readonly description?: string;

  /**
   * 含まれるテストケースのリスト（順序付き）
   */
  readonly testCases: readonly TestScenarioCaseRef[];

  /**
   * 作成者ユーザーID
   */
  readonly createdBy: string;

  /**
   * 作成日時
   */
  readonly createdAt: Date;

  /**
   * 承認者ユーザーID（承認済みの場合）
   */
  readonly approvedBy?: string;

  /**
   * 承認日時（承認済みの場合）
   */
  readonly approvedAt?: Date;
}> {}
