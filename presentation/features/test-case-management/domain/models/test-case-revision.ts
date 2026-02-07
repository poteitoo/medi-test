import { Data } from "effect";
import type { TestCaseContent } from "./test-case-content";
import type { RevisionStatus } from "./revision-status";

/**
 * TestCaseRevision ドメインモデル
 *
 * テストケースのリビジョン（バージョン）を表現するドメインモデル
 * テストケースの内容は常にリビジョンに紐づく
 */
export class TestCaseRevision extends Data.Class<{
  /**
   * リビジョンID（UUID）
   */
  readonly id: string;

  /**
   * 所属テストケースID
   */
  readonly testCaseId: string;

  /**
   * リビジョン番号（1から始まる連番）
   */
  readonly rev: number;

  /**
   * リビジョンのステータス
   */
  readonly status: RevisionStatus;

  /**
   * テストケースのタイトル
   */
  readonly title: string;

  /**
   * テストケースの内容（JSON）
   */
  readonly content: TestCaseContent;

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
