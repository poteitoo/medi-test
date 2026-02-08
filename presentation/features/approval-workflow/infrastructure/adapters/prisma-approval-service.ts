import { Effect, Layer } from "effect";
import type { Prisma } from "@prisma/client";
import { Database } from "@shared/db/layers/prisma-layer";
import { ApprovalService } from "../../application/ports/approval-service";
import { ApprovalValidationError } from "../../domain/errors/approval-errors";
import {
  Approval,
  type ApprovalObjectType,
  type EvidenceLink,
} from "../../domain/models/approval";

/**
 * Prisma承認をドメインモデルにマッピング
 *
 * @param approval - Prisma承認オブジェクト
 * @returns ドメインモデルの承認
 */
const mapPrismaToApproval = (approval: {
  id: string;
  object_id: string;
  object_type: string;
  step: number;
  decision: string;
  approver_id: string;
  comment: string | null;
  evidence_links: unknown;
  timestamp: Date;
}): Approval => {
  // evidence_linksをEvidenceLink[]にパース
  let evidenceLinks: EvidenceLink[] | undefined;
  if (approval.evidence_links !== null) {
    try {
      const parsed = JSON.parse(String(approval.evidence_links));
      if (Array.isArray(parsed)) {
        evidenceLinks = parsed as EvidenceLink[];
      }
    } catch {
      // JSONパースエラーの場合はundefined
      evidenceLinks = undefined;
    }
  }

  return new Approval({
    id: approval.id,
    objectId: approval.object_id,
    objectType: approval.object_type as ApprovalObjectType,
    approverId: approval.approver_id,
    decision: approval.decision as "APPROVED" | "REJECTED",
    step: approval.step,
    comment: approval.comment ?? undefined,
    evidenceLinks,
    timestamp: approval.timestamp,
  });
};

/**
 * Prisma ApprovalService実装
 *
 * @description
 * PrismaClientを使用したApprovalServiceの実装です。
 * 承認情報をPostgreSQLデータベースに永続化します。
 */
export const PrismaApprovalServiceLive = Layer.effect(
  ApprovalService,
  Effect.gen(function* () {
    const prisma = yield* Database;

    return {
      createApproval: (data) =>
        Effect.gen(function* () {
          // 却下の場合、コメントは必須
          if (data.decision === "REJECTED" && !data.comment?.trim()) {
            return yield* Effect.fail(
              new ApprovalValidationError({
                message: "却下理由のコメントが必要です",
                field: "comment",
              }),
            );
          }

          const approval = yield* Effect.tryPromise({
            try: () =>
              prisma.approval.create({
                data: {
                  object_id: data.objectId,
                  object_type: data.objectType,
                  approver_id: data.approverId,
                  step: data.step,
                  decision: data.decision,
                  comment: data.comment ?? null,
                  evidence_links:
                    data.evidenceLinks && data.evidenceLinks.length > 0
                      ? (data.evidenceLinks as unknown as Prisma.InputJsonValue)
                      : undefined,
                },
              }),
            catch: (error) =>
              new ApprovalValidationError({
                message: `承認の作成に失敗しました: ${String(error)}`,
              }),
          });

          return mapPrismaToApproval(approval);
        }),

      getApprovals: (objectType, objectId) =>
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
            catch: () => [],
          }).pipe(Effect.orElseSucceed(() => []));

          return approvals.map(mapPrismaToApproval);
        }),

      getApprovalsByApprover: (approverId) =>
        Effect.gen(function* () {
          const approvals = yield* Effect.tryPromise({
            try: () =>
              prisma.approval.findMany({
                where: { approver_id: approverId },
                orderBy: { timestamp: "desc" },
              }),
            catch: () => [],
          }).pipe(Effect.orElseSucceed(() => []));

          return approvals.map(mapPrismaToApproval);
        }),

      hasApproval: (objectType, objectId, step, approverId) =>
        Effect.gen(function* () {
          const approval = yield* Effect.tryPromise({
            try: () =>
              prisma.approval.findFirst({
                where: {
                  object_id: objectId,
                  object_type: objectType,
                  step,
                  approver_id: approverId,
                },
              }),
            catch: () => null,
          }).pipe(Effect.orElseSucceed(() => null));

          return approval !== null;
        }),

      getLatestApproval: (objectType, objectId) =>
        Effect.gen(function* () {
          const approval = yield* Effect.tryPromise({
            try: () =>
              prisma.approval.findFirst({
                where: {
                  object_id: objectId,
                  object_type: objectType,
                },
                orderBy: { timestamp: "desc" },
              }),
            catch: () => null,
          }).pipe(Effect.orElseSucceed(() => null));

          if (!approval) {
            return null;
          }

          return mapPrismaToApproval(approval);
        }),
    };
  }),
);
