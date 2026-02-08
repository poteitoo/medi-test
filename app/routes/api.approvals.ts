import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect, Layer } from "effect";
import { PrismaLayer } from "@shared/db/layers/prisma-layer";
import { TestCaseManagementLayer } from "~/features/test-case-management/infrastructure/layers/test-case-layer";
import { PrismaApprovalServiceLive } from "~/features/approval-workflow/infrastructure/adapters/prisma-approval-service";
import { approveRevision } from "~/features/approval-workflow/application/usecases/approve-revision";
import { rejectRevision } from "~/features/approval-workflow/application/usecases/reject-revision";
import { z } from "zod";

/**
 * 承認リクエストスキーマ
 */
const approvalRequestSchema = z.object({
  action: z.enum(["approve", "reject"]),
  revisionId: z.string().uuid(),
  approverId: z.string().uuid(),
  comment: z.string().optional(),
});

/**
 * Approval Layer (Test Case + Approval Service)
 */
const ApprovalWorkflowLayer = Layer.mergeAll(
  TestCaseManagementLayer,
  PrismaApprovalServiceLive,
).pipe(Layer.provide(PrismaLayer));

/**
 * POST /api/approvals
 *
 * リビジョンを承認または却下
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = approvalRequestSchema.safeParse(body);

    if (!validation.success) {
      return data(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { action, revisionId, approverId, comment } = validation.data;

    if (action === "approve") {
      // 承認
      const program = approveRevision({
        revisionId,
        approverId,
        comment,
      }).pipe(Effect.provide(ApprovalWorkflowLayer));

      const result = await Effect.runPromise(program);

      return data({
        data: result,
        message: "Revision approved successfully",
      });
    } else {
      // 却下
      if (!comment) {
        return data(
          { error: "Comment is required for rejection" },
          { status: 400 },
        );
      }

      const program = rejectRevision({
        revisionId,
        approverId,
        comment,
      }).pipe(Effect.provide(ApprovalWorkflowLayer));

      const result = await Effect.runPromise(program);

      return data({
        data: result,
        message: "Revision rejected successfully",
      });
    }
  } catch (error) {
    console.error("Failed to process approval:", error);
    return data(
      {
        error: "Failed to process approval",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
