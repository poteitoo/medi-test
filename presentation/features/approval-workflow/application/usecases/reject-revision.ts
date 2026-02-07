import { Effect } from "effect";
import { ApprovalService } from "../ports/approval-service";
import { TestCaseRepository } from "~/features/test-case-management/application/ports/test-case-repository";
import { isApprovable } from "~/features/test-case-management/domain/models/revision-status";
import { NotRejectableError } from "~/features/test-case-management/domain/errors/status-errors";

/**
 * リビジョン却下の入力パラメータ
 */
export type RejectRevisionInput = {
  /**
   * リビジョンID
   */
  readonly revisionId: string;

  /**
   * 承認者ユーザーID
   */
  readonly approverId: string;

  /**
   * コメント（必須）
   */
  readonly comment: string;
};

/**
 * リビジョン却下ユースケース
 *
 * テストケースリビジョンを却下する
 * 承認待ち状態のリビジョンのみ却下可能
 *
 * @example
 * const program = rejectRevision({
 *   revisionId: "revision-123",
 *   approverId: "user-456",
 *   comment: "テスト手順が不明確です",
 * });
 */
export const rejectRevision = (input: RejectRevisionInput) =>
  Effect.gen(function* () {
    const testCaseRepo = yield* TestCaseRepository;
    const approvalService = yield* ApprovalService;

    // リビジョンを取得
    const revision = yield* testCaseRepo.findRevisionById(input.revisionId);

    // 却下可能な状態かチェック（承認待ちのみ）
    if (!isApprovable(revision.status)) {
      return yield* Effect.fail(
        new NotRejectableError({
          message: "このリビジョンは却下できません",
          currentStatus: revision.status,
        }),
      );
    }

    // コメントが必須
    if (!input.comment || input.comment.trim().length === 0) {
      return yield* Effect.fail(
        new Error("却下理由のコメントが必要です"),
      );
    }

    // 却下情報を作成
    const approval = yield* approvalService.reject({
      objectId: input.revisionId,
      objectType: "CASE_REVISION",
      approverId: input.approverId,
      comment: input.comment,
    });

    // リビジョンのステータスを却下に更新
    const updatedRevision = yield* testCaseRepo.updateRevisionStatus(
      input.revisionId,
      "DEPRECATED",
    );

    return {
      revision: updatedRevision,
      approval,
    };
  });
