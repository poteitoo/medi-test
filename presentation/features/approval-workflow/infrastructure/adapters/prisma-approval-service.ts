import { Effect, Layer } from "effect";
import { PrismaService } from "@shared/db/layers/prisma-layer";
import {
  ApprovalService,
  ApprovalNotFoundError,
  ApprovalCreationError,
} from "../../application/ports/approval-service";
import {
  Approval,
  type ApprovalObjectType,
} from "../../domain/models/approval";

/**
 * Prisma ApprovalService実装
 */
export const PrismaApprovalService = Layer.effect(
  ApprovalService,
  Effect.gen(function* () {
    const prisma = yield* PrismaService;

    return {
      findById: (approvalId: string) =>
        Effect.gen(function* () {
          const approval = yield* Effect.tryPromise({
            try: () =>
              prisma.approval.findUnique({ where: { id: approvalId } }),
            catch: (error) =>
              new ApprovalNotFoundError(
                `承認情報の取得に失敗しました: ${String(error)}`,
              ),
          });

          if (!approval) {
            return yield* Effect.fail(
              new ApprovalNotFoundError(
                `承認情報が見つかりません: ${approvalId}`,
              ),
            );
          }

          return new Approval({
            id: approval.id,
            objectId: approval.object_id,
            objectType: approval.object_type as ApprovalObjectType,
            approverId: approval.approver_id,
            decision: approval.decision as "APPROVED" | "REJECTED",
            comment: approval.comment ?? undefined,
            timestamp: approval.timestamp,
            step: approval.step,
          });
        }),

      findByObjectId: (objectId: string, objectType: ApprovalObjectType) =>
        Effect.gen(function* () {
          const approvals = yield* Effect.tryPromise({
            try: () =>
              prisma.approval.findMany({
                where: {
                  object_id: objectId,
                  object_type: objectType,
                },
                orderBy: { timestamp: "desc" },
              }),
            catch: (error) =>
              new Error(`承認履歴の取得に失敗しました: ${String(error)}`),
          });

          return approvals.map(
            (a) =>
              new Approval({
                id: a.id,
                objectId: a.object_id,
                objectType: a.object_type as ApprovalObjectType,
                approverId: a.approver_id,
                decision: a.decision as "APPROVED" | "REJECTED",
                step: a.step,
                comment: a.comment ?? undefined,
                timestamp: a.timestamp,
              }),
          );
        }),

      findByApproverId: (approverId: string) =>
        Effect.gen(function* () {
          const approvals = yield* Effect.tryPromise({
            try: () =>
              prisma.approval.findMany({
                where: { approver_id: approverId },
                orderBy: { timestamp: "desc" },
              }),
            catch: (error) =>
              new Error(`承認履歴の取得に失敗しました: ${String(error)}`),
          });

          return approvals.map(
            (a) =>
              new Approval({
                id: a.id,
                objectId: a.object_id,
                objectType: a.object_type as ApprovalObjectType,
                approverId: a.approver_id,
                decision: a.decision as "APPROVED" | "REJECTED",
                step: a.step,
                comment: a.comment ?? undefined,
                timestamp: a.timestamp,
              }),
          );
        }),

      approve: (input) =>
        Effect.gen(function* () {
          const approval = yield* Effect.tryPromise({
            try: () =>
              prisma.approval.create({
                data: {
                  object_id: input.objectId,
                  object_type: input.objectType,
                  approver_id: input.approverId,
                  step: input.step ?? 1,
                  decision: "APPROVED",
                  comment: input.comment ?? null,
                },
              }),
            catch: (error) =>
              new ApprovalCreationError(
                `承認の作成に失敗しました: ${String(error)}`,
              ),
          });

          return new Approval({
            id: approval.id,
            objectId: approval.object_id,
            objectType: approval.object_type as ApprovalObjectType,
            approverId: approval.approver_id,
            step: approval.step,
            decision: "APPROVED",
            comment: approval.comment ?? undefined,
            timestamp: approval.timestamp,
          });
        }),

      reject: (input) =>
        Effect.gen(function* () {
          const approval = yield* Effect.tryPromise({
            try: () =>
              prisma.approval.create({
                data: {
                  object_id: input.objectId,
                  object_type: input.objectType,
                  approver_id: input.approverId,
                  step: input.step ?? 1,
                  decision: "REJECTED",
                  comment: input.comment ?? null,
                },
              }),
            catch: (error) =>
              new ApprovalCreationError(
                `却下の作成に失敗しました: ${String(error)}`,
              ),
          });

          return new Approval({
            id: approval.id,
            objectId: approval.object_id,
            objectType: approval.object_type as ApprovalObjectType,
            approverId: approval.approver_id,
            step: approval.step,
            decision: "REJECTED",
            comment: approval.comment ?? undefined,
            timestamp: approval.timestamp,
          });
        }),

      delete: (approvalId: string) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () => prisma.approval.delete({ where: { id: approvalId } }),
            catch: (error) =>
              new ApprovalNotFoundError(
                `承認情報の削除に失敗しました: ${String(error)}`,
              ),
          });
        }),

      isApproved: (objectId: string, objectType: ApprovalObjectType) =>
        Effect.gen(function* () {
          const approval = yield* Effect.tryPromise({
            try: () =>
              prisma.approval.findFirst({
                where: {
                  object_id: objectId,
                  object_type: objectType,
                  decision: "APPROVED",
                },
              }),
            catch: () => null,
          }).pipe(Effect.orElseSucceed(() => null));

          return approval !== null;
        }),

      isRejected: (objectId: string, objectType: ApprovalObjectType) =>
        Effect.gen(function* () {
          const approval = yield* Effect.tryPromise({
            try: () =>
              prisma.approval.findFirst({
                where: {
                  object_id: objectId,
                  object_type: objectType,
                  decision: "REJECTED",
                },
              }),
            catch: () => null,
          }).pipe(Effect.orElseSucceed(() => null));

          return approval !== null;
        }),
    };
  }),
);
