import { Effect } from "effect";
import { ApprovalService } from "../ports/approval-service";
import { TestCaseRepository } from "~/features/test-case-management/application/ports/test-case-repository";
import { isApprovable } from "~/features/test-case-management/domain/models/revision-status";
import { NotRejectableError } from "~/features/test-case-management/domain/errors/status-errors";
import {
  AlreadyApprovedException,
  ApprovalValidationError,
} from "../../domain/errors/approval-errors";
import type { Approval, EvidenceLink } from "../../domain/models/approval";

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
   * 承認ステップ（デフォルト: 1）
   */
  readonly step?: number;

  /**
   * コメント（必須）
   */
  readonly comment: string;

  /**
   * 証拠リンク（オプション）
   */
  readonly evidenceLinks?: EvidenceLink[];
};

/**
 * リビジョン却下ユースケース
 *
 * @description
 * テストケースリビジョンを却下します。
 * - 承認待ち状態のリビジョンのみ却下可能
 * - 却下理由のコメントは必須
 * - 同じステップで同じユーザーが既に却下している場合はエラー
 * - 却下後、リビジョンのステータスをDEPRECATEDに更新
 *
 * @example
 * ```typescript
 * const program = rejectRevision({
 *   revisionId: "revision-123",
 *   approverId: "user-456",
 *   step: 1,
 *   comment: "テスト手順が不明確です",
 *   evidenceLinks: [{ url: "https://example.com/issue", title: "指摘事項" }]
 * });
 *
 * const result = await Effect.runPromise(
 *   program.pipe(Effect.provide(layer))
 * );
 * ```
 *
 * @param input - 却下入力パラメータ
 * @returns 却下結果（リビジョンと承認情報）
 */
export const rejectRevision = (input: RejectRevisionInput) =>
  Effect.gen(function* () {
    const testCaseRepo = yield* TestCaseRepository;
    const approvalService = yield* ApprovalService;

    const step = input.step ?? 1;

    // リビジョンを取得
    const revision = yield* testCaseRepo.findRevisionById(input.revisionId);

    if (!revision) {
      return yield* Effect.fail(new Error("リビジョンが見つかりません"));
    }

    // 却下可能な状態かチェック（承認待ちのみ）
    if (!isApprovable(revision.status)) {
      return yield* Effect.fail(
        new NotRejectableError({
          message: "このリビジョンは却下できません",
          currentStatus: revision.status,
        }),
      );
    }

    // 既に却下しているかチェック
    const hasApproval = yield* approvalService.hasApproval(
      "CASE_REVISION",
      input.revisionId,
      step,
      input.approverId,
    );

    if (hasApproval) {
      return yield* Effect.fail(
        new AlreadyApprovedException({
          message: "既にこのステップで却下されています",
          objectId: input.revisionId,
          approverId: input.approverId,
          step,
        }),
      );
    }

    // 却下情報を作成（コメント必須チェックはサービス内で実施）
    const approval = yield* approvalService.createApproval({
      objectType: "CASE_REVISION",
      objectId: input.revisionId,
      step,
      decision: "REJECTED",
      approverId: input.approverId,
      comment: input.comment,
      evidenceLinks: input.evidenceLinks,
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
