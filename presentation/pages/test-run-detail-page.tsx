import { useLoaderData, useFetcher, useParams } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { Effect } from "effect";
import { TestExecutionLayer } from "~/features/test-execution/infrastructure/layers/test-execution-layer";
import { startTestRun } from "~/features/test-execution/application/usecases/start-test-run";
import { completeTestRun } from "~/features/test-execution/application/usecases/complete-test-run";
import { recordTestResult } from "~/features/test-execution/application/usecases/record-test-result";
import { recordTestResultSchema } from "~/lib/schemas/test-result";
import { TestRunDetail } from "~/features/test-execution/ui/components/test-run-detail";

type LoaderData = {
  readonly run: {
    readonly id: string;
    readonly status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
    readonly assigneeUserId: string;
    readonly buildRef?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  };
  readonly items: ReadonlyArray<{
    readonly id: string;
    readonly runId: string;
    readonly caseRevisionId: string;
    readonly order: number;
    readonly testCaseTitle: string;
    readonly latestResult?: {
      readonly status: "PASS" | "FAIL" | "BLOCKED" | "SKIPPED";
      readonly executedAt: Date;
      readonly executedBy: string;
    };
  }>;
  readonly summary: {
    readonly total: number;
    readonly executed: number;
    readonly passed: number;
    readonly failed: number;
    readonly blocked: number;
    readonly skipped: number;
  };
};

/**
 * Loader: テストラン詳細データを取得
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { runId } = params;

  if (!runId) {
    throw new Response("runId is required", { status: 400 });
  }

  try {
    const response = await fetch(`/api/test-runs/${runId}`);

    if (!response.ok) {
      throw new Response("Failed to load test run", { status: response.status });
    }

    const result = await response.json();
    return data(result.data);
  } catch (error) {
    console.error("Failed to load test run:", error);
    throw new Response("Failed to load test run", { status: 500 });
  }
}

/**
 * Action: テストラン操作（結果記録、開始、完了）
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const { runId } = params;

  if (!runId) {
    return data({ error: "runId is required" }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const actionType = formData.get("_action") as string;

    // Start run
    if (actionType === "start") {
      const program = startTestRun({ runId }).pipe(
        Effect.provide(TestExecutionLayer),
      );

      await Effect.runPromise(program);

      return redirect(`/test-runs/${runId}`);
    }

    // Complete run
    if (actionType === "complete") {
      const force = formData.get("force") === "true";

      const program = completeTestRun({ runId, force }).pipe(
        Effect.provide(TestExecutionLayer),
      );

      await Effect.runPromise(program);

      return redirect(`/test-runs/${runId}`);
    }

    // Record result
    if (actionType === "recordResult") {
      const itemId = formData.get("itemId") as string;
      const body = JSON.parse(formData.get("data") as string);

      if (!itemId) {
        return data({ error: "itemId is required" }, { status: 400 });
      }

      // バリデーション
      const validation = recordTestResultSchema.safeParse({
        ...body,
        runId,
        runItemId: itemId,
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

      const program = recordTestResult({
        runId: validatedData.runId,
        runItemId: validatedData.runItemId,
        status: validatedData.status,
        evidence: validatedData.evidence,
        bugLinks: validatedData.bugLinks,
        executedBy: validatedData.executedBy,
      }).pipe(Effect.provide(TestExecutionLayer));

      await Effect.runPromise(program);

      return redirect(`/test-runs/${runId}`);
    }

    return data({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to perform action:", error);
    return data(
      {
        error: "Failed to perform action",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * TestRunDetailPage Component
 *
 * テストラン詳細ページ
 * テストケースの実行と結果記録を行う
 */
export default function TestRunDetailPage() {
  const { run, items, summary } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const params = useParams();
  const runId = params.runId;

  const loading = fetcher.state !== "idle";

  const handleResultSubmit = (
    itemId: string,
    resultData: {
      status: "PASS" | "FAIL" | "BLOCKED" | "SKIPPED";
      evidence?: {
        logs?: string;
        screenshots?: string[];
        links?: string[];
      };
      bugLinks?: Array<{
        url: string;
        title: string;
        severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
      }>;
    },
  ) => {
    const formData = new FormData();
    formData.append("_action", "recordResult");
    formData.append("itemId", itemId);
    formData.append(
      "data",
      JSON.stringify({
        ...resultData,
        executedBy: "current-user-id", // TODO: 認証システムから取得
      }),
    );

    fetcher.submit(formData, { method: "post" });
  };

  const handleStartRun = () => {
    const formData = new FormData();
    formData.append("_action", "start");
    fetcher.submit(formData, { method: "post" });
  };

  const handleCompleteRun = () => {
    const formData = new FormData();
    formData.append("_action", "complete");
    formData.append("force", "false");
    fetcher.submit(formData, { method: "post" });
  };

  if (!runId) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-destructive">テストランIDが指定されていません</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <TestRunDetail
        run={run}
        items={items}
        summary={summary}
        onResultSubmit={handleResultSubmit}
        onStartRun={handleStartRun}
        onCompleteRun={handleCompleteRun}
        loading={loading}
      />
    </div>
  );
}
