import { Effect } from "effect";
import { ReleaseRepository } from "../ports/release-repository";
import { GateEvaluationService } from "../ports/gate-evaluation-service";
import { WaiverService } from "../ports/waiver-service";
import type { GateCondition } from "../../domain/models/gate-condition";
import { DEFAULT_GATE_CONDITIONS } from "../../domain/models/gate-condition";
import { InvalidReleaseStatusError } from "../../domain/errors/gate-errors";
import { isEvaluatable } from "../../domain/models/release-status";

/**
 * ゲート評価の入力パラメータ
 */
export type EvaluateGateInput = {
  /**
   * リリースID
   */
  readonly releaseId: string;

  /**
   * 評価するゲート条件（省略時はデフォルト条件）
   */
  readonly conditions?: readonly GateCondition[];
};

/**
 * ゲート評価ユースケース
 *
 * リリースのゲート条件を評価し、違反を検出する
 * 有効なWaiverがある違反は考慮しない
 *
 * @example
 * const program = evaluateGate({
 *   releaseId: "release-123",
 * });
 */
export const evaluateGate = (input: EvaluateGateInput) =>
  Effect.gen(function* () {
    const releaseRepo = yield* ReleaseRepository;
    const gateService = yield* GateEvaluationService;
    const waiverService = yield* WaiverService;

    // リリースを取得してステータスをチェック
    const release = yield* releaseRepo.findById(input.releaseId);

    // ゲート評価が可能なステータスかチェック
    if (!isEvaluatable(release.status)) {
      return yield* Effect.fail(
        new InvalidReleaseStatusError({
          message: "このリリースステータスではゲート評価できません",
          currentStatus: release.status,
          expectedStatus: "EXECUTING or GATE_CHECK",
        }),
      );
    }

    // ゲート条件を評価
    const conditions = input.conditions ?? DEFAULT_GATE_CONDITIONS;
    const evaluation = yield* gateService.evaluate(input.releaseId, conditions);

    // 各違反に対して有効なWaiverがあるかチェック
    const violationsWithWaivers = yield* Effect.forEach(
      evaluation.violations,
      (violation) =>
        Effect.gen(function* () {
          // 違反に対する有効なWaiverを検索
          const waiver = yield* waiverService.findValidWaiverForTarget(
            input.releaseId,
            "OTHER", // For now, use OTHER as a generic type
            undefined,
          );

          return {
            ...violation,
            hasWaiver: waiver !== null,
            waiverId: waiver?.id,
          };
        }),
    );

    // リリースステータスをGATE_CHECKに更新（まだEXECUTINGの場合）
    if (release.status === "EXECUTING") {
      yield* releaseRepo.updateStatus(input.releaseId, "GATE_CHECK");
    }

    return {
      ...evaluation,
      violations: violationsWithWaivers,
      passed: !violationsWithWaivers.some(
        (v) => v.severity === "CRITICAL" && !v.hasWaiver,
      ),
    };
  });
