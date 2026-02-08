import { Data } from "effect";
import type { ResultStatus } from "./result-status";

/**
 * Evidence データ構造
 */
export type Evidence = {
  readonly logs?: string;
  readonly screenshots?: readonly string[];
  readonly links?: readonly string[];
};

/**
 * Bug Link データ構造
 */
export type BugLink = {
  readonly url: string;
  readonly title: string;
  readonly severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
};

/**
 * TestResult ドメインモデル
 *
 * テスト実行結果を表現するドメインモデル
 * 各テストケースは複数回実行可能（最新結果が有効）
 */
export class TestResult extends Data.Class<{
  /**
   * テスト結果ID（UUID）
   */
  readonly id: string;

  /**
   * テストランアイテムID
   */
  readonly runItemId: string;

  /**
   * 結果ステータス
   */
  readonly status: ResultStatus;

  /**
   * エビデンス（ログ、スクリーンショット、リンク）
   */
  readonly evidence?: Evidence;

  /**
   * バグリンク
   */
  readonly bugLinks?: readonly BugLink[];

  /**
   * 実行者ユーザーID
   */
  readonly executedBy: string;

  /**
   * 実行日時
   */
  readonly executedAt: Date;
}> {}
