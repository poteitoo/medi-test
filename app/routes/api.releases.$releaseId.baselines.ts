import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { ReleaseLayer } from "~/features/release-gate/infrastructure/layers/release-layer";
import { setBaseline } from "~/features/release-gate/application/usecases/set-baseline";
import { setBaselineSchema } from "~/lib/schemas/release";

/**
 * POST /api/releases/:releaseId/baselines
 *
 * リリースのベースラインを設定
 */
export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const { releaseId } = params;

    if (!releaseId) {
      return data({ error: "releaseId is required" }, { status: 400 });
    }

    const body = await request.json();

    // バリデーション
    const validation = setBaselineSchema.safeParse({
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

    const program = setBaseline({
      releaseId: validatedData.releaseId,
      sourceListRevisionId: validatedData.sourceListRevisionId,
      createdBy: validatedData.createdBy,
    }).pipe(Effect.provide(ReleaseLayer));

    const baseline = await Effect.runPromise(program);

    return data(
      {
        data: baseline,
        message: "ベースラインを設定しました",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to set baseline:", error);
    return data(
      {
        error: "Failed to set baseline",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
