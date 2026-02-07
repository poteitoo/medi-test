import { Effect } from "effect";
import { TestCaseRepository } from "../ports/test-case-repository";
import {
  isEditable,
  canTransitionTo,
} from "../../domain/models/revision-status";
import { InvalidStatusTransitionError } from "../../domain/errors/status-errors";
import { RevisionImmutableError } from "../../domain/errors/revision-errors";

/**
 * レビュー提出の入力パラメータ
 */
export type SubmitForReviewInput = {
  /**
   * リビジョンID
   */
  readonly revisionId: string;
};

/**
 * レビュー提出ユースケース
 *
 * テストケースリビジョンを承認待ち状態にする
 * 下書き状態のリビジョンのみ提出可能
 *
 * @example
 * const program = submitForReview({
 *   revisionId: "revision-123",
 * });
 *
 * const revision = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 */
export const submitForReview = (input: SubmitForReviewInput) =>
  Effect.gen(function* () {
    const repo = yield* TestCaseRepository;

    // リビジョンを取得
    const revision = yield* repo.findRevisionById(input.revisionId);

    // ステータスが編集可能かチェック
    if (!isEditable(revision.status)) {
      return yield* Effect.fail(
        new RevisionImmutableError({
          message: "このリビジョンは編集できません",
          revisionId: input.revisionId,
          status: revision.status,
        }),
      );
    }

    // ステータス遷移が可能かチェック
    if (!canTransitionTo(revision.status, "IN_REVIEW")) {
      return yield* Effect.fail(
        new InvalidStatusTransitionError({
          message: `${revision.status} から IN_REVIEW への遷移はできません`,
          from: revision.status,
          to: "IN_REVIEW",
        }),
      );
    }

    // ステータスを更新
    const updatedRevision = yield* repo.updateRevisionStatus(
      input.revisionId,
      "IN_REVIEW",
    );

    return updatedRevision;
  });
