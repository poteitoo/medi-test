import { Effect } from "effect";
import { WaiverService } from "../ports/waiver-service";

/**
 * 期限切れWaiverチェックの入力パラメータ
 */
export type CheckExpiredWaiversInput = {
  /**
   * チェック基準日時（省略時は現在時刻）
   */
  readonly now?: Date;

  /**
   * 自動削除するかどうか
   */
  readonly autoDelete?: boolean;
};

/**
 * 期限切れWaiverチェックユースケース
 *
 * 有効期限が切れたWaiverを検出し、オプションで自動削除する
 * 定期実行（cron job等）での使用を想定
 *
 * @example
 * const program = checkExpiredWaivers({
 *   now: new Date(),
 *   autoDelete: true,
 * });
 */
export const checkExpiredWaivers = (input?: CheckExpiredWaiversInput) =>
  Effect.gen(function* () {
    const waiverService = yield* WaiverService;

    const now = input?.now ?? new Date();
    const autoDelete = input?.autoDelete ?? false;

    // 期限切れWaiverを検出
    const expiredWaivers = yield* waiverService.findExpired(now);

    // 自動削除が有効な場合は削除
    if (autoDelete && expiredWaivers.length > 0) {
      yield* Effect.forEach(expiredWaivers, (waiver) =>
        waiverService.delete(waiver.id),
      );
    }

    return {
      expiredWaivers,
      deletedCount: autoDelete ? expiredWaivers.length : 0,
      checkedAt: now,
    };
  });
