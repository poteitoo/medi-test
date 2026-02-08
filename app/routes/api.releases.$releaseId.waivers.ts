import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { ReleaseLayer } from "~/features/release-gate/infrastructure/layers/release-layer";
import { issueWaiver } from "~/features/release-gate/application/usecases/issue-waiver";
import { WaiverService } from "~/features/release-gate/application/ports/waiver-service";
import { issueWaiverSchema } from "~/lib/schemas/waiver";

/**
 * GET /api/releases/:releaseId/waivers
 *
 * リリースのWaiver一覧を取得
 */
export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { releaseId } = params;

    if (!releaseId) {
      return data({ error: "releaseId is required" }, { status: 400 });
    }

    const program = Effect.gen(function* () {
      const waiverService = yield* WaiverService;
      return yield* waiverService.findByReleaseId(releaseId);
    }).pipe(Effect.provide(ReleaseLayer));

    const waivers = await Effect.runPromise(program);

    return data({
      data: waivers,
      meta: {
        count: waivers.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch waivers:", error);
    return data(
      {
        error: "Failed to fetch waivers",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/releases/:releaseId/waivers
 *
 * Waiverを発行
 */
export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const { releaseId } = params;

    if (!releaseId) {
      return data({ error: "releaseId is required" }, { status: 400 });
    }

    const body = await request.json();

    // バリデーション
    const validation = issueWaiverSchema.safeParse({
      ...body,
      releaseId,
    });

    if (!validation.success) {
      return data(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validatedData = validation.data;

    const program = issueWaiver({
      releaseId: validatedData.releaseId,
      targetType: validatedData.targetType,
      targetId: validatedData.targetId,
      reason: validatedData.reason,
      expiresAt: validatedData.expiresAt,
      issuerId: validatedData.issuerId,
    }).pipe(Effect.provide(ReleaseLayer));

    const waiver = await Effect.runPromise(program);

    return data(
      {
        data: waiver,
        message: "Waiverを発行しました",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to issue waiver:", error);
    return data(
      {
        error: "Failed to issue waiver",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
