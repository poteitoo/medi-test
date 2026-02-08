import { Effect } from "effect";
import { ApprovalService } from "../ports/approval-service";
import { TestCaseRepository } from "~/features/test-case-management/application/ports/test-case-repository";
import { isApprovable } from "~/features/test-case-management/domain/models/revision-status";
import { NotApprovableError } from "~/features/test-case-management/domain/errors/status-errors";
import {
  AlreadyApprovedException,
  ApprovalValidationError,
} from "../../domain/errors/approval-errors";
import type { Approval, EvidenceLink } from "../../domain/models/approval";

/**
 * リビジョン承認の入力パラメータ
 */
export type ApproveRevisionInput = {
  /**
   * リビジョンID
   */
  readonly revisionId: string;

  /**
   * 承認者ユーザーID
   */
  readonly approverId: string;

  /**
   * 承認ステップ（デフォルト: 1）
   */
  readonly step?: number;

  /**
   * コメント（オプション）
   */
  readonly comment?: string;

  /**
   * 証拠リンク（オプション）
   */
  readonly evidenceLinks?: EvidenceLink[];
};

/**
 * リビジョン承認ユースケース
 *
 * @description
 * テストケースリビジョンを承認します。
 * - 承認待ち状態のリビジョンのみ承認可能
 * - 同じステップで同じユーザーが既に承認している場合はエラー
 * - 承認後、リビジョンのステータスをAPPROVEDに更新
 *
 * @example
 * ```typescript
 * const program = approveRevision({
 *   revisionId: "revision-123",
 *   approverId: "user-456",
 *   step: 1,
 *   comment: "問題ありません",
 *   evidenceLinks: [{ url: "https://example.com/test", title: "テスト結果" }]
 * });
 *
 * const result = await Effect.runPromise(
 *   program.pipe(Effect.provide(layer))
 * );
 * ```
 *
 * @param input - 承認入力パラメータ
 * @returns 承認結果（リビジョンと承認情報）
 */
export const approveRevision = (input: ApproveRevisionInput) =>
  Effect.gen(function* () {
    const testCaseRepo = yield* TestCaseRepository;
    const approvalService = yield* ApprovalService;

    const step = input.step ?? 1;

    // リビジョンを取得
    const revision = yield* testCaseRepo.findRevisionById(input.revisionId);

    if (!revision) {
      return yield* Effect.fail(new Error("リビジョンが見つかりません"));
    }

    // 承認可能な状態かチェック
    if (!isApprovable(revision.status)) {
      return yield* Effect.fail(
        new NotApprovableError({
          message: "このリビジョンは承認できません",
          currentStatus: revision.status,
        }),
      );
    }

    // 既に承認しているかチェック
    const hasApproval = yield* approvalService.hasApproval(
      "CASE_REVISION",
      input.revisionId,
      step,
      input.approverId,
    );

    if (hasApproval) {
      return yield* Effect.fail(
        new AlreadyApprovedException({
          message: "既にこのステップで承認されています",
          objectId: input.revisionId,
          approverId: input.approverId,
          step,
        }),
      );
    }

    // 承認情報を作成
    const approval = yield* approvalService.createApproval({
      objectType: "CASE_REVISION",
      objectId: input.revisionId,
      step,
      decision: "APPROVED",
      approverId: input.approverId,
      comment: input.comment,
      evidenceLinks: input.evidenceLinks,
    });

    // リビジョンのステータスを承認済みに更新
    const updatedRevision = yield* testCaseRepo.updateRevisionStatus(
      input.revisionId,
      "APPROVED",
    );

    return {
      revision: updatedRevision,
      approval,
    };
  });
