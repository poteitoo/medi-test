import { Effect } from "effect";
import { ApprovalService } from "../ports/approval-service";
import { TestCaseRepository } from "~/features/test-case-management/application/ports/test-case-repository";
import { isApprovable } from "~/features/test-case-management/domain/models/revision-status";
import { NotApprovableError } from "~/features/test-case-management/domain/errors/status-errors";

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
   * コメント（オプション）
   */
  readonly comment?: string;
};

/**
 * リビジョン承認ユースケース
 *
 * テストケースリビジョンを承認する
 * 承認待ち状態のリビジョンのみ承認可能
 *
 * @example
 * const program = approveRevision({
 *   revisionId: "revision-123",
 *   approverId: "user-456",
 *   comment: "問題ありません",
 * });
 */
export const approveRevision = (input: ApproveRevisionInput) =>
  Effect.gen(function* () {
    const testCaseRepo = yield* TestCaseRepository;
    const approvalService = yield* ApprovalService;

    // リビジョンを取得
    const revision = yield* testCaseRepo.findRevisionById(input.revisionId);

    // 承認可能な状態かチェック
    if (!isApprovable(revision.status)) {
      return yield* Effect.fail(
        new NotApprovableError({
          message: "このリビジョンは承認できません",
          currentStatus: revision.status,
        }),
      );
    }

    // 承認情報を作成
    const approval = yield* approvalService.approve({
      objectId: input.revisionId,
      objectType: "CASE_REVISION",
      approverId: input.approverId,
      comment: input.comment,
    });

    // リビジョンのステータスを承認済みに更新
    const updatedRevision = yield* testCaseRepo.updateRevisionStatus(
      input.revisionId,
      "APPROVED",
      input.approverId,
    );

    return {
      revision: updatedRevision,
      approval,
    };
  });
