import { Data } from "effect";
import type { TestCaseContent } from "./test-case-content";
import type { RevisionStatus } from "./revision-status";
import { isEditable } from "./revision-status";

/**
 * Json型（any型の代わりに使用）
 *
 * JSONとして保存可能な任意の値を表現します。
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

/**
 * TestCaseRevision - テストケースのリビジョン
 *
 * テストケースの特定バージョンの内容を保持します。
 * リビジョン番号（rev）は1から始まる連番で、テストケースごとに独立して採番されます。
 *
 * ステータス遷移:
 * - DRAFT → IN_REVIEW → APPROVED
 * - DRAFT → APPROVED (直接承認)
 * - IN_REVIEW → DRAFT (差し戻し)
 * - APPROVED → DEPRECATED
 */
export class TestCaseRevision extends Data.Class<{
  /**
   * リビジョンID（UUID）
   *
   * このリビジョンを一意に識別するID
   */
  readonly id: string;

  /**
   * 所属テストケースID（stable ID）
   *
   * このリビジョンが属するテストケースのstable ID
   */
  readonly caseStableId: string;

  /**
   * リビジョン番号（1から始まる連番）
   *
   * テストケースごとに独立して採番されます
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
   * テストケースの内容（JSONB）
   */
  readonly content: TestCaseContent;

  /**
   * 前リビジョンとの差分（JSONB、オプション）
   *
   * 前のリビジョンから変更された内容を記録します。
   * rev=1の場合はundefinedです。
   */
  readonly diff?: Json;

  /**
   * リビジョン作成理由（オプション）
   *
   * 例: "テスト手順の追加", "期待結果の修正"
   */
  readonly reason?: string;

  /**
   * 作成者ユーザーID
   */
  readonly createdBy: string;

  /**
   * 作成日時
   */
  readonly createdAt: Date;
}> {
  /**
   * このリビジョンが編集可能かチェック
   *
   * @returns 編集可能な場合はtrue
   */
  isEditable(): boolean {
    return isEditable(this.status);
  }

  /**
   * 下書き状態かチェック
   *
   * @returns 下書きの場合はtrue
   */
  isDraft(): boolean {
    return this.status === "DRAFT";
  }

  /**
   * 承認済み状態かチェック
   *
   * @returns 承認済みの場合はtrue
   */
  isApproved(): boolean {
    return this.status === "APPROVED";
  }

  /**
   * 指定ユーザーが編集可能かチェック
   *
   * @param userId - チェック対象のユーザーID
   * @returns 編集可能な場合はtrue
   */
  canEdit(userId: string): boolean {
    // 作成者のみが編集可能、かつステータスが編集可能
    return this.createdBy === userId && this.isEditable();
  }

  /**
   * 表示用タイトルを取得
   *
   * @returns "タイトル (rev.番号)" の形式
   */
  getDisplayTitle(): string {
    return `${this.title} (rev.${this.rev})`;
  }
}
