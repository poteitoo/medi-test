import { Effect } from "effect";
import { ReleaseRepository } from "../ports/release-repository";
import { GateEvaluationService } from "../ports/gate-evaluation-service";
import { WaiverService } from "../ports/waiver-service";
import { ApprovalService } from "~/features/approval-workflow/application/ports/approval-service";
import {
  GateViolationError,
  InvalidReleaseStatusError,
} from "../../domain/errors/gate-errors";
import { isApprovable } from "../../domain/models/release-status";
import { hasBlockingViolations } from "../../domain/models/gate-violation";

/**
 * リリース承認の入力パラメータ
 */
export type ApproveReleaseInput = {
  /**
   * リリースID
   */
  readonly releaseId: string;

  /**
   * 承認者ユーザーID
   */
  readonly approverId: string;

  /**
   * コメント
   */
  readonly comment?: string;
};

/**
 * リリース承認ユースケース
 *
 * リリースのゲート条件を評価し、全て通過している場合にリリースを承認する
 * ブロッキング違反がある場合は承認できない
 *
 * @example
 * const program = approveRelease({
 *   releaseId: "release-123",
 *   approverId: "user-456",
 *   comment: "全てのゲート条件を満たしています",
 * });
 */
export const approveRelease = (input: ApproveReleaseInput) =>
  Effect.gen(function* () {
    const releaseRepo = yield* ReleaseRepository;
    const gateService = yield* GateEvaluationService;
    const waiverService = yield* WaiverService;
    const approvalService = yield* ApprovalService;

    // リリースを取得してステータスをチェック
    const release = yield* releaseRepo.findById(input.releaseId);

    // 承認可能なステータスかチェック
    if (!isApprovable(release.status)) {
      return yield* Effect.fail(
        new InvalidReleaseStatusError({
          message: "このリリースステータスでは承認できません",
          currentStatus: release.status,
          expectedStatus: "GATE_CHECK",
        }),
      );
    }

    // ゲート条件を評価
    const evaluation = yield* gateService.evaluate(input.releaseId);

    // 各違反に対して有効なWaiverがあるかチェック
    const violationsWithWaivers = yield* Effect.forEach(
      evaluation.violations,
      (violation) =>
        Effect.gen(function* () {
          const waiver = yield* waiverService.findValidWaiverForTarget(
            input.releaseId,
            "OTHER",
            undefined,
          );

          return {
            ...violation,
            hasWaiver: waiver !== null,
            waiverId: waiver?.id,
          };
        }),
    );

    // ブロッキング違反があるかチェック
    if (hasBlockingViolations(violationsWithWaivers)) {
      return yield* Effect.fail(
        new GateViolationError({
          message:
            "リリース承認がブロックされています。ゲート条件違反を解決するか、Waiverを発行してください。",
          violations: violationsWithWaivers,
          releaseId: input.releaseId,
        }),
      );
    }

    // 承認情報を作成
    const approval = yield* approvalService.approve({
      objectId: input.releaseId,
      objectType: "RELEASE",
      approverId: input.approverId,
      comment: input.comment,
    });

    // リリースステータスをAPPROVED_FOR_RELEASEに更新
    const updatedRelease = yield* releaseRepo.updateStatus(
      input.releaseId,
      "APPROVED_FOR_RELEASE",
    );

    return {
      release: updatedRelease,
      approval,
      evaluation: {
        ...evaluation,
        violations: violationsWithWaivers,
      },
    };
  });
