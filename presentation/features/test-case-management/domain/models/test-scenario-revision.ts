import { Data } from "effect";
import type { RevisionStatus } from "./revision-status";
import { isEditable } from "./revision-status";
import type { Json } from "./test-case-revision";

/**
 * TestScenarioItem - シナリオに含まれるテストケース項目
 *
 * シナリオ内でのテストケースの位置と設定を管理します。
 */
export class TestScenarioItem extends Data.Class<{
  /**
   * テストケースリビジョンID
   *
   * このシナリオで使用するテストケースの特定リビジョンを指定
   */
  readonly caseRevisionId: string;

  /**
   * シナリオ内での実行順序（1から始まる連番）
   */
  readonly order: number;

  /**
   * オプションフラグ
   *
   * trueの場合、このテストケースはオプション（実行必須ではない）
   */
  readonly optionalFlag: boolean;

  /**
   * 備考（オプション）
   *
   * このテストケースをシナリオに含める理由や注意点など
   */
  readonly note?: string;
}> {
  /**
   * 必須テストケースかチェック
   *
   * @returns 必須の場合はtrue
   */
  isRequired(): boolean {
    return !this.optionalFlag;
  }

  /**
   * オプションテストケースかチェック
   *
   * @returns オプションの場合はtrue
   */
  isOptional(): boolean {
    return this.optionalFlag;
  }
}

/**
 * TestScenarioRevision - テストシナリオのリビジョン
 *
 * テストシナリオの特定バージョンの内容を保持します。
 * 複数のテストケースを順序付けて管理し、一連のテストフローを定義します。
 */
export class TestScenarioRevision extends Data.Class<{
  /**
   * リビジョンID（UUID）
   *
   * このリビジョンを一意に識別するID
   */
  readonly id: string;

  /**
   * 所属テストシナリオID（stable ID）
   *
   * このリビジョンが属するテストシナリオのstable ID
   */
  readonly scenarioStableId: string;

  /**
   * リビジョン番号（1から始まる連番）
   *
   * テストシナリオごとに独立して採番されます
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
   * シナリオの説明（オプション）
   */
  readonly description?: string;

  /**
   * 含まれるテストケースのリスト（順序付き）
   */
  readonly items: readonly TestScenarioItem[];

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
   * 例: "テストケースの追加", "実行順序の変更"
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
   * 総テストケース数を取得
   *
   * @returns 含まれるテストケースの総数
   */
  getTotalCases(): number {
    return this.items.length;
  }

  /**
   * 必須テストケース数を取得
   *
   * @returns 必須テストケースの数
   */
  getRequiredCases(): number {
    return this.items.filter((item) => item.isRequired()).length;
  }

  /**
   * オプションテストケース数を取得
   *
   * @returns オプションテストケースの数
   */
  getOptionalCases(): number {
    return this.items.filter((item) => item.isOptional()).length;
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
