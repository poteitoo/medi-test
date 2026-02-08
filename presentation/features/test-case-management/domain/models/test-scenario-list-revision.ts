import { Data } from "effect";
import type { RevisionStatus } from "./revision-status";
import { isEditable } from "./revision-status";
import type { Json } from "./test-case-revision";

/**
 * TestScenarioListItem - リストに含まれるシナリオ項目
 *
 * リスト内でのシナリオの位置と包含ルールを管理します。
 */
export class TestScenarioListItem extends Data.Class<{
  /**
   * テストシナリオリビジョンID
   *
   * このリストで使用するテストシナリオの特定リビジョンを指定
   */
  readonly scenarioRevisionId: string;

  /**
   * リスト内での順序（1から始まる連番）
   */
  readonly order: number;

  /**
   * 包含ルール（オプション）
   *
   * 例: "FULL"（全ケース実行）, "REQUIRED_ONLY"（必須のみ）など
   * アプリケーション層で定義されたルールに従って解釈されます。
   */
  readonly includeRule?: string;

  /**
   * 備考（オプション）
   *
   * このシナリオをリストに含める理由や注意点など
   */
  readonly note?: string;
}> {
  /**
   * 全ケース実行ルールかチェック
   *
   * @returns 全ケース実行の場合はtrue
   */
  isFullInclude(): boolean {
    return this.includeRule === "FULL" || this.includeRule === undefined;
  }

  /**
   * 必須ケースのみ実行ルールかチェック
   *
   * @returns 必須のみの場合はtrue
   */
  isRequiredOnly(): boolean {
    return this.includeRule === "REQUIRED_ONLY";
  }
}

/**
 * TestScenarioListRevision - テストシナリオリストのリビジョン
 *
 * テストシナリオリストの特定バージョンの内容を保持します。
 * 複数のテストシナリオを順序付けて管理し、リリースやスプリント単位でのテスト実行計画を定義します。
 */
export class TestScenarioListRevision extends Data.Class<{
  /**
   * リビジョンID（UUID）
   *
   * このリビジョンを一意に識別するID
   */
  readonly id: string;

  /**
   * 所属テストシナリオリストID（stable ID）
   *
   * このリビジョンが属するテストシナリオリストのstable ID
   */
  readonly listStableId: string;

  /**
   * リビジョン番号（1から始まる連番）
   *
   * テストシナリオリストごとに独立して採番されます
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
   * リストの説明（オプション）
   */
  readonly description?: string;

  /**
   * 含まれるテストシナリオのリスト（順序付き）
   */
  readonly items: readonly TestScenarioListItem[];

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
   * 例: "v2.0リリース用テスト計画", "スプリント15のテスト範囲"
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
   * 総シナリオ数を取得
   *
   * @returns 含まれるシナリオの総数
   */
  getTotalScenarios(): number {
    return this.items.length;
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
