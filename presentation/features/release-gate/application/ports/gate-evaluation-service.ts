import { Context, Effect } from "effect";
import type { GateCondition } from "../../domain/models/gate-condition";
import type { GateViolation } from "../../domain/models/gate-violation";

/**
 * ゲート評価結果
 */
export type GateEvaluationResult = {
  /**
   * リリースID
   */
  readonly releaseId: string;

  /**
   * 評価したゲート条件
   */
  readonly conditions: readonly GateCondition[];

  /**
   * 検出された違反
   */
  readonly violations: readonly GateViolation[];

  /**
   * ゲートを通過したかどうか
   */
  readonly passed: boolean;

  /**
   * 評価日時
   */
  readonly evaluatedAt: Date;
};

/**
 * GateEvaluationService Port
 *
 * リリースゲート条件の評価を行うサービス
 */
export class GateEvaluationService extends Context.Tag("GateEvaluationService")<
  GateEvaluationService,
  {
    /**
     * リリースのゲート条件を評価
     *
     * @param releaseId - 評価対象のリリースID
     * @param conditions - 評価するゲート条件（省略時はデフォルト条件）
     */
    readonly evaluate: (
      releaseId: string,
      conditions?: readonly GateCondition[],
    ) => Effect.Effect<GateEvaluationResult, Error>;

    /**
     * テストカバレッジを計算
     */
    readonly calculateCoverage: (
      releaseId: string,
    ) => Effect.Effect<number, Error>;

    /**
     * 全テストケースが合格しているかチェック
     */
    readonly checkAllTestsPass: (
      releaseId: string,
    ) => Effect.Effect<boolean, Error>;

    /**
     * 致命的バグがリンクされていないかチェック
     */
    readonly checkNoCriticalBugs: (
      releaseId: string,
    ) => Effect.Effect<boolean, Error>;

    /**
     * 全承認が完了しているかチェック
     */
    readonly checkAllApprovalsComplete: (
      releaseId: string,
    ) => Effect.Effect<boolean, Error>;

    /**
     * 未承認変更がないかチェック
     */
    readonly checkNoUnapprovedChanges: (
      releaseId: string,
    ) => Effect.Effect<boolean, Error>;
  }
>() {}
