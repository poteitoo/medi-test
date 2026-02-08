import { Effect } from "effect";
import { TestCaseRepository } from "../ports/test-case-repository";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";
import { TestCaseRevisionNotFoundError } from "../../domain/errors/test-case-errors";
import { RevisionImmutableError } from "../../domain/errors/revision-errors";
import { InvalidStatusTransitionError } from "../../domain/errors/status-errors";
import {
  isEditable,
  canTransitionTo,
} from "../../domain/models/revision-status";

/**
 * レビュー提出ユースケース
 *
 * テストケースリビジョンをレビュー中（IN_REVIEW）状態に遷移させます。
 * DRAFT状態のリビジョンのみ提出可能です。
 *
 * 処理フロー:
 * 1. TestCaseRepositoryを取得
 * 2. リビジョンIDでリビジョンを検索
 * 3. リビジョンが存在しDRAFT状態であることを検証
 * 4. ステータスをIN_REVIEWに更新
 * 5. 更新されたリビジョンを返却
 *
 * ビジネスルール:
 * - DRAFT状態のリビジョンのみレビューに提出できます
 * - IN_REVIEWまたはAPPROVED状態のリビジョンは再提出できません
 * - ステータス遷移ルールに従って検証が行われます
 *
 * @param revisionId - リビジョンID
 * @param submittedBy - 提出者のユーザーID（将来の拡張用）
 * @returns 更新されたテストケースリビジョン
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import { submitForReview } from "./submit-for-review";
 * import { TestCaseManagementLayer } from "~/infrastructure/layers";
 *
 * const program = submitForReview("rev-123", "user-456");
 *
 * const updatedRevision = await Effect.runPromise(
 *   program.pipe(Effect.provide(TestCaseManagementLayer))
 * );
 *
 * console.log(updatedRevision.status); // "IN_REVIEW"
 * ```
 *
 * @example
 * // エラーハンドリング
 * ```typescript
 * const program = submitForReview("rev-123", "user-456").pipe(
 *   Effect.catchTag("RevisionImmutableError", (error) =>
 *     Effect.succeed({ message: error.displayMessage })
 *   ),
 *   Effect.catchTag("InvalidStatusTransitionError", (error) =>
 *     Effect.succeed({ message: error.displayMessage })
 *   ),
 *   Effect.catchTag("TestCaseRevisionNotFoundError", (error) =>
 *     Effect.succeed({ message: error.displayMessage })
 *   ),
 * );
 * ```
 */
export const submitForReview = (
  revisionId: string,
  submittedBy: string,
): Effect.Effect<
  TestCaseRevision,
  | RevisionImmutableError
  | TestCaseRevisionNotFoundError
  | InvalidStatusTransitionError,
  TestCaseRepository
> =>
  Effect.gen(function* () {
    // ステップ1: TestCaseRepositoryを取得
    const repo = yield* TestCaseRepository;

    // ステップ2: リビジョンIDでリビジョンを検索
    const revision = yield* repo.findRevisionById(revisionId);

    if (revision === null) {
      return yield* Effect.fail(
        new TestCaseRevisionNotFoundError({
          revisionId,
          message: `リビジョン ${revisionId} が見つかりません`,
        }),
      );
    }

    // ステップ3: リビジョンが存在しDRAFT状態であることを検証
    if (!isEditable(revision.status)) {
      return yield* Effect.fail(
        new RevisionImmutableError({
          revisionId,
          status: revision.status,
          message: `このリビジョンは編集できません（現在: ${revision.status}）`,
        }),
      );
    }

    // ステータス遷移が可能かチェック
    if (!canTransitionTo(revision.status, "IN_REVIEW")) {
      return yield* Effect.fail(
        new InvalidStatusTransitionError({
          from: revision.status,
          to: "IN_REVIEW",
          message: `${revision.status} から IN_REVIEW への遷移はできません`,
        }),
      );
    }

    // ステップ4: ステータスをIN_REVIEWに更新
    const updatedRevision = yield* repo.updateRevisionStatus(
      revisionId,
      "IN_REVIEW",
    );

    // ステップ5: 更新されたリビジョンを返却
    return updatedRevision;
  });
