import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { ReleaseLayer } from "~/features/release-gate/infrastructure/layers/release-layer";
import { createRelease } from "~/features/release-gate/application/usecases/create-release";
import { ReleaseRepository } from "~/features/release-gate/application/ports/release-repository";
import { createReleaseSchema } from "~/lib/schemas/release";

/**
 * GET /api/releases
 *
 * プロジェクトのリリース一覧を取得
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return data({ error: "projectId is required" }, { status: 400 });
    }

    const program = Effect.gen(function* () {
      const releaseRepo = yield* ReleaseRepository;
      return yield* releaseRepo.findByProjectId(projectId);
    }).pipe(Effect.provide(ReleaseLayer));

    const releases = await Effect.runPromise(program);

    return data({
      data: releases,
      meta: {
        count: releases.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch releases:", error);
    return data(
      {
        error: "Failed to fetch releases",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/releases
 *
 * 新しいリリースを作成
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = createReleaseSchema.safeParse(body);
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

    const program = createRelease({
      projectId: validatedData.projectId,
      name: validatedData.name,
      description: validatedData.description,
      buildRef: validatedData.buildRef,
    }).pipe(Effect.provide(ReleaseLayer));

    const release = await Effect.runPromise(program);

    return data(
      {
        data: release,
        message: "リリースを作成しました",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create release:", error);
    return data(
      {
        error: "Failed to create release",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
