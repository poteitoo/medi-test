import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect, Layer } from "effect";
import { PrismaLayer } from "@shared/db/layers/prisma-layer";
import { PrismaApprovalServiceLive } from "~/features/approval-workflow/infrastructure/adapters/prisma-approval-service";
import { ApprovalService } from "~/features/approval-workflow/application/ports/approval-service";
import { createApprovalSchema } from "~/lib/schemas/approval";
import type { EvidenceLink } from "~/features/approval-workflow/domain/models/approval";

/**
 * Approval Layer
 */
const ApprovalLayer = PrismaApprovalServiceLive.pipe(
  Layer.provide(PrismaLayer),
);

/**
 * POST /api/approvals
 *
 * 承認を作成（承認または却下）
 *
 * このエンドポイントは汎用的な承認エンドポイントで、
 * 任意のオブジェクトタイプ（テストケース、シナリオ、リリースなど）の承認を作成できます。
 *
 * @example
 * ```json
 * {
 *   "objectType": "CASE_REVISION",
 *   "objectId": "uuid",
 *   "step": 1,
 *   "decision": "APPROVED",
 *   "approverId": "uuid",
 *   "comment": "問題ありません",
 *   "evidenceLinks": [
 *     { "url": "https://example.com/test", "title": "テスト結果" }
 *   ]
 * }
 * ```
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = createApprovalSchema.safeParse(body);

    if (!validation.success) {
      return data(
        {
          error: "バリデーションに失敗しました",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validatedData = validation.data;

    // 却下の場合、コメントが必須
    if (validatedData.decision === "REJECTED" && !validatedData.comment) {
      return data(
        { error: "却下の場合はコメントが必須です" },
        { status: 400 },
      );
    }

    // 承認を作成
    const program = Effect.gen(function* () {
      const approvalService = yield* ApprovalService;

      return yield* approvalService.createApproval({
        objectType: validatedData.objectType,
        objectId: validatedData.objectId,
        step: validatedData.step,
        decision: validatedData.decision,
        approverId: validatedData.approverId,
        comment: validatedData.comment,
        evidenceLinks: validatedData.evidenceLinks as EvidenceLink[] | undefined,
      });
    }).pipe(Effect.provide(ApprovalLayer));

    const approval = await Effect.runPromise(program);

    return data(
      {
        data: approval,
        message:
          validatedData.decision === "APPROVED"
            ? "承認が完了しました"
            : "却下が完了しました",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create approval:", error);
    return data(
      {
        error: "承認の作成に失敗しました",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
