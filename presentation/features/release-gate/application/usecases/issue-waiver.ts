import { Effect } from "effect";
import { WaiverService } from "../ports/waiver-service";
import { ReleaseRepository } from "../ports/release-repository";
import type { WaiverTargetType } from "../../domain/models/waiver";

/**
 * Waiver発行の入力パラメータ
 */
export type IssueWaiverInput = {
  /**
   * リリースID
   */
  readonly releaseId: string;

  /**
   * 適用除外対象のタイプ
   */
  readonly targetType: WaiverTargetType;

  /**
   * 適用除外対象のID（TestResult ID、Revision ID等）
   */
  readonly targetId?: string;

  /**
   * 適用除外の理由（必須）
   */
  readonly reason: string;

  /**
   * 有効期限
   */
  readonly expiresAt: Date;

  /**
   * 発行者ユーザーID
   */
  readonly issuerId: string;
};

/**
 * Waiver発行ユースケース
 *
 * ゲート条件違反に対してWaiverを発行し、リリース承認のブロックを解除する
 * Waiverは有効期限付きで発行され、期限切れ後は無効となる
 *
 * @example
 * const program = issueWaiver({
 *   releaseId: "release-123",
 *   targetType: "FAIL_RESULT",
 *   targetId: "result-456",
 *   reason: "既知の非致命的バグ。次リリースで修正予定",
 *   expiresAt: new Date("2026-03-31"),
 *   issuerId: "user-789",
 * });
 */
export const issueWaiver = (input: IssueWaiverInput) =>
  Effect.gen(function* () {
    const waiverService = yield* WaiverService;
    const releaseRepo = yield* ReleaseRepository;

    // リリースが存在するかチェック
    yield* releaseRepo.findById(input.releaseId);

    // 理由が必須
    if (!input.reason || input.reason.trim().length === 0) {
      return yield* Effect.fail(new Error("Waiverの理由が必要です"));
    }

    // 有効期限が未来の日付かチェック
    const now = new Date();
    if (input.expiresAt <= now) {
      return yield* Effect.fail(
        new Error("Waiverの有効期限は未来の日付である必要があります"),
      );
    }

    // Waiverを発行
    const waiver = yield* waiverService.issue({
      releaseId: input.releaseId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      expiresAt: input.expiresAt,
      issuerId: input.issuerId,
    });

    return waiver;
  });
