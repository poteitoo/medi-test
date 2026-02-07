import { Effect, Layer } from "effect";
import { Database } from "@shared/db/layers/prisma-layer";
import { WaiverService } from "../../application/ports/waiver-service";
import { Waiver } from "../../domain/models/waiver";
import type { WaiverTargetType } from "../../domain/models/waiver";
import { isExpired } from "../../domain/models/waiver";
import {
  WaiverNotFoundError,
  WaiverExpiredError,
} from "../../domain/errors/waiver-errors";

/**
 * Prisma WaiverService実装
 */
export const PrismaWaiverService = Layer.effect(
  WaiverService,
  Effect.gen(function* () {
    const prisma = yield* Database;

    return {
      findById: (waiverId: string) =>
        Effect.gen(function* () {
          const waiver = yield* Effect.tryPromise({
            try: () =>
              prisma.waiver.findUnique({
                where: { id: waiverId },
              }),
            catch: (error) =>
              new WaiverNotFoundError({
                message: `Waiverの取得に失敗しました: ${String(error)}`,
                waiverId,
              }),
          });

          if (!waiver) {
            return yield* Effect.fail(
              new WaiverNotFoundError({
                message: `Waiverが見つかりません: ${waiverId}`,
                waiverId,
              }),
            );
          }

          return new Waiver({
            id: waiver.id,
            releaseId: waiver.release_id,
            targetType: waiver.target_type as WaiverTargetType,
            targetId: waiver.target_id ?? undefined,
            reason: waiver.reason,
            expiresAt: waiver.expires_at,
            issuerId: waiver.issuer_id,
            createdAt: waiver.created_at,
          });
        }),

      findByReleaseId: (releaseId: string) =>
        Effect.gen(function* () {
          const waivers = yield* Effect.tryPromise({
            try: () =>
              prisma.waiver.findMany({
                where: { release_id: releaseId },
                orderBy: { created_at: "desc" },
              }),
            catch: (error) =>
              new Error(`Waiver一覧の取得に失敗しました: ${String(error)}`),
          });

          return waivers.map(
            (w) =>
              new Waiver({
                id: w.id,
                releaseId: w.release_id,
                targetType: w.target_type as WaiverTargetType,
                targetId: w.target_id ?? undefined,
                reason: w.reason,
                expiresAt: w.expires_at,
                issuerId: w.issuer_id,
                createdAt: w.created_at,
              }),
          );
        }),

      issue: (input) =>
        Effect.gen(function* () {
          const waiver = yield* Effect.tryPromise({
            try: () =>
              prisma.waiver.create({
                data: {
                  release_id: input.releaseId,
                  target_type: input.targetType,
                  target_id: input.targetId,
                  reason: input.reason,
                  expires_at: input.expiresAt,
                  issuer_id: input.issuerId,
                },
              }),
            catch: (error) =>
              new Error(`Waiverの発行に失敗しました: ${String(error)}`),
          });

          return new Waiver({
            id: waiver.id,
            releaseId: waiver.release_id,
            targetType: waiver.target_type as WaiverTargetType,
            targetId: waiver.target_id ?? undefined,
            reason: waiver.reason,
            expiresAt: waiver.expires_at,
            issuerId: waiver.issuer_id,
            createdAt: waiver.created_at,
          });
        }),

      delete: (waiverId: string) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () =>
              prisma.waiver.delete({
                where: { id: waiverId },
              }),
            catch: (error) =>
              new WaiverNotFoundError({
                message: `Waiverの削除に失敗しました: ${String(error)}`,
                waiverId,
              }),
          });
        }),

      findExpired: (now?: Date) =>
        Effect.gen(function* () {
          const checkDate = now ?? new Date();
          const waivers = yield* Effect.tryPromise({
            try: () =>
              prisma.waiver.findMany({
                where: {
                  expires_at: {
                    lt: checkDate,
                  },
                },
                orderBy: { expires_at: "desc" },
              }),
            catch: (error) =>
              new Error(
                `期限切れWaiverの取得に失敗しました: ${String(error)}`,
              ),
          });

          return waivers.map(
            (w) =>
              new Waiver({
                id: w.id,
                releaseId: w.release_id,
                targetType: w.target_type as WaiverTargetType,
                targetId: w.target_id ?? undefined,
                reason: w.reason,
                expiresAt: w.expires_at,
                issuerId: w.issuer_id,
                createdAt: w.created_at,
              }),
          );
        }),

      isValid: (waiverId: string, now?: Date) =>
        Effect.gen(function* () {
          const waiver = yield* Effect.tryPromise({
            try: () =>
              prisma.waiver.findUnique({
                where: { id: waiverId },
              }),
            catch: (error) =>
              new WaiverNotFoundError({
                message: `Waiverの取得に失敗しました: ${String(error)}`,
                waiverId,
              }),
          });

          if (!waiver) {
            return yield* Effect.fail(
              new WaiverNotFoundError({
                message: `Waiverが見つかりません: ${waiverId}`,
                waiverId,
              }),
            );
          }

          const waiverModel = new Waiver({
            id: waiver.id,
            releaseId: waiver.release_id,
            targetType: waiver.target_type as WaiverTargetType,
            targetId: waiver.target_id ?? undefined,
            reason: waiver.reason,
            expiresAt: waiver.expires_at,
            issuerId: waiver.issuer_id,
            createdAt: waiver.created_at,
          });

          if (isExpired(waiverModel, now)) {
            return yield* Effect.fail(
              new WaiverExpiredError({
                message: `Waiverは有効期限切れです: ${waiverId}`,
                waiverId,
                expiresAt: waiverModel.expiresAt,
              }),
            );
          }

          return true;
        }),

      findValidWaiverForTarget: (
        releaseId: string,
        targetType: WaiverTargetType,
        targetId?: string,
      ) =>
        Effect.gen(function* () {
          const now = new Date();
          const waiver = yield* Effect.tryPromise({
            try: () =>
              prisma.waiver.findFirst({
                where: {
                  release_id: releaseId,
                  target_type: targetType,
                  target_id: targetId,
                  expires_at: {
                    gt: now,
                  },
                },
                orderBy: { created_at: "desc" },
              }),
            catch: (error) =>
              new Error(`Waiver検索に失敗しました: ${String(error)}`),
          });

          if (!waiver) {
            return null;
          }

          return new Waiver({
            id: waiver.id,
            releaseId: waiver.release_id,
            targetType: waiver.target_type as WaiverTargetType,
            targetId: waiver.target_id ?? undefined,
            reason: waiver.reason,
            expiresAt: waiver.expires_at,
            issuerId: waiver.issuer_id,
            createdAt: waiver.created_at,
          });
        }),
    };
  }),
);
