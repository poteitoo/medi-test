import { Effect } from "effect";
import { ReleaseRepository } from "../ports/release-repository";
import { InvalidReleaseStatusError } from "../../domain/errors/gate-errors";
import { isEvaluatable } from "../../domain/models/release-status";

/**
 * ベースライン設定の入力パラメータ
 */
export type SetBaselineInput = {
  /**
   * リリースID
   */
  readonly releaseId: string;

  /**
   * ソースとなるテストシナリオリストリビジョンID
   */
  readonly sourceListRevisionId: string;

  /**
   * ベースライン作成者ユーザーID
   */
  readonly createdBy: string;
};

/**
 * ベースライン設定ユースケース
 *
 * リリースに対してテストシナリオリストのベースラインを設定する
 * ベースラインはリリース時点で実行すべき承認済みテストケースセットを固定する
 *
 * @example
 * const program = setBaseline({
 *   releaseId: "release-123",
 *   sourceListRevisionId: "list-rev-456",
 *   createdBy: "user-789",
 * });
 */
export const setBaseline = (input: SetBaselineInput) =>
  Effect.gen(function* () {
    const releaseRepo = yield* ReleaseRepository;

    // リリースを取得してステータスをチェック
    const release = yield* releaseRepo.findById(input.releaseId);

    // ベースラインを設定できるのはPLANNINGまたはEXECUTINGステータスのみ
    if (release.status === "RELEASED") {
      return yield* Effect.fail(
        new InvalidReleaseStatusError({
          message: "リリース完了後はベースラインを設定できません",
          currentStatus: release.status,
          expectedStatus: "PLANNING or EXECUTING",
        }),
      );
    }

    // ベースラインを作成
    const baseline = yield* releaseRepo.createBaseline({
      releaseId: input.releaseId,
      sourceListRevisionId: input.sourceListRevisionId,
      createdBy: input.createdBy,
    });

    // リリースステータスをEXECUTINGに更新（まだPLANNINGの場合）
    if (release.status === "PLANNING") {
      yield* releaseRepo.updateStatus(input.releaseId, "EXECUTING");
    }

    return baseline;
  });
