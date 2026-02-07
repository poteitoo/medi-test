import { Data } from "effect";

/**
 * ゲート条件タイプ
 */
export type GateConditionType =
  | "MIN_TEST_COVERAGE" // 最小テストカバレッジ率
  | "ALL_TESTS_PASS" // 全テスト合格
  | "NO_CRITICAL_BUGS" // 致命的バグなし
  | "ALL_APPROVALS_COMPLETE" // 全承認完了
  | "NO_UNAPPROVED_CHANGES"; // 未承認変更なし

/**
 * GateCondition ドメインモデル
 *
 * リリースゲート条件を表現するドメインモデル
 * リリース承認の可否を判定するための条件定義
 */
export class GateCondition extends Data.Class<{
  /**
   * 条件タイプ
   */
  readonly type: GateConditionType;

  /**
   * 条件名
   */
  readonly name: string;

  /**
   * 必須条件かどうか
   */
  readonly required: boolean;

  /**
   * しきい値（パーセンテージ、カウント等）
   */
  readonly threshold?: number;

  /**
   * 条件説明
   */
  readonly description?: string;
}> {}

/**
 * デフォルトゲート条件
 */
export const DEFAULT_GATE_CONDITIONS: readonly GateCondition[] = [
  new GateCondition({
    type: "ALL_TESTS_PASS",
    name: "全テストケース合格",
    required: true,
    description: "全ての必須テストケースが合格していること",
  }),
  new GateCondition({
    type: "ALL_APPROVALS_COMPLETE",
    name: "全承認完了",
    required: true,
    description: "全てのテストシナリオリストが承認されていること",
  }),
  new GateCondition({
    type: "MIN_TEST_COVERAGE",
    name: "最小テストカバレッジ",
    required: true,
    threshold: 80,
    description: "要件カバレッジが80%以上であること",
  }),
  new GateCondition({
    type: "NO_CRITICAL_BUGS",
    name: "致命的バグなし",
    required: true,
    description: "致命的（Critical/High）なバグがリンクされていないこと",
  }),
  new GateCondition({
    type: "NO_UNAPPROVED_CHANGES",
    name: "未承認変更なし",
    required: false,
    description: "承認待ちまたは却下されたリビジョンが存在しないこと",
  }),
];

/**
 * ゲート条件タイプの表示名
 */
export const GATE_CONDITION_TYPE_LABELS: Record<GateConditionType, string> = {
  MIN_TEST_COVERAGE: "最小テストカバレッジ",
  ALL_TESTS_PASS: "全テスト合格",
  NO_CRITICAL_BUGS: "致命的バグなし",
  ALL_APPROVALS_COMPLETE: "全承認完了",
  NO_UNAPPROVED_CHANGES: "未承認変更なし",
};
