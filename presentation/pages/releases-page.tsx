import { useLoaderData, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { Effect } from "effect";
import { ReleaseLayer } from "~/features/release-gate/infrastructure/layers/release-layer";
import { ReleaseRepository } from "~/features/release-gate/application/ports/release-repository";
import { ReleaseList } from "~/features/release-gate/ui/components/release-list";
import type { Release } from "~/features/release-gate/domain/models/release";

/**
 * Loader: プロジェクトのリリース一覧を取得
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

    return data({ releases, projectId });
  } catch (error) {
    console.error("Failed to load releases:", error);
    return data(
      {
        error: "Failed to load releases",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * ReleasesPage
 *
 * リリース一覧ページ
 */
export default function ReleasesPage() {
  const { releases, projectId } = useLoaderData<{
    releases: Release[];
    projectId: string;
  }>();
  const navigate = useNavigate();

  const handleCreateNew = () => {
    navigate(`/releases/new?projectId=${projectId}`);
  };

  return (
    <div className="container mx-auto py-6">
      <ReleaseList releases={releases} onCreateNew={handleCreateNew} />
    </div>
  );
}
