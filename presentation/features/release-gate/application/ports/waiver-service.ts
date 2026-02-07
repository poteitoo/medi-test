import { Context, Effect } from "effect";
import type { Waiver } from "../../domain/models/waiver";
import type { WaiverTargetType } from "../../domain/models/waiver";
import {
  WaiverNotFoundError,
  WaiverExpiredError,
} from "../../domain/errors/waiver-errors";

/**
 * WaiverService Port
 *
 * Waiverのデータアクセスとビジネスロジックを抽象化するポート
 */
export class WaiverService extends Context.Tag("WaiverService")<
  WaiverService,
  {
    /**
     * WaiverをIDで取得
     */
    readonly findById: (
      waiverId: string,
    ) => Effect.Effect<Waiver, WaiverNotFoundError>;

    /**
     * リリースのWaiver一覧を取得
     */
    readonly findByReleaseId: (
      releaseId: string,
    ) => Effect.Effect<readonly Waiver[], Error>;

    /**
     * Waiverを発行
     */
    readonly issue: (input: {
      readonly releaseId: string;
      readonly targetType: WaiverTargetType;
      readonly targetId?: string;
      readonly reason: string;
      readonly expiresAt: Date;
      readonly issuerId: string;
    }) => Effect.Effect<Waiver, Error>;

    /**
     * Waiverを削除
     */
    readonly delete: (
      waiverId: string,
    ) => Effect.Effect<void, WaiverNotFoundError>;

    /**
     * 有効期限切れのWaiverを検出
     */
    readonly findExpired: (
      now?: Date,
    ) => Effect.Effect<readonly Waiver[], Error>;

    /**
     * Waiverが有効かチェック
     */
    readonly isValid: (
      waiverId: string,
      now?: Date,
    ) => Effect.Effect<boolean, WaiverNotFoundError | WaiverExpiredError>;

    /**
     * 特定の対象に対する有効なWaiverを検索
     */
    readonly findValidWaiverForTarget: (
      releaseId: string,
      targetType: WaiverTargetType,
      targetId?: string,
    ) => Effect.Effect<Waiver | null, Error>;
  }
>() {}
