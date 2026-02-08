import { useLoaderData, useFetcher, useRevalidator } from "react-router";
import { useEffect } from "react";
import type { RunStatus } from "../../domain/models/run-status";
import type { ResultStatus } from "../../domain/models/result-status";

/**
 * テストラン詳細データ型
 */
export type TestRunDetailData = {
  readonly run: {
    readonly id: string;
    readonly status: RunStatus;
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
      readonly status: ResultStatus;
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
 * useTestRun Hook
 *
 * テストラン詳細データとアクションを提供するカスタムフック
 *
 * @example
 * ```tsx
 * function TestRunDetailPage() {
 *   const { run, items, summary, actions, loading } = useTestRun();
 *
 *   return (
 *     <div>
 *       <h1>Test Run: {run.id}</h1>
 *       <button onClick={actions.start}>Start</button>
 *       <button onClick={actions.complete}>Complete</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTestRun() {
  const data = useLoaderData<TestRunDetailData>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  const loading = fetcher.state !== "idle" || revalidator.state === "loading";

  /**
   * テストランを開始する
   */
  const startRun = () => {
    const formData = new FormData();
    formData.append("_action", "start");
    fetcher.submit(formData, { method: "post" });
  };

  /**
   * テストランを完了する
   */
  const completeRun = (force = false) => {
    const formData = new FormData();
    formData.append("_action", "complete");
    formData.append("force", String(force));
    fetcher.submit(formData, { method: "post" });
  };

  /**
   * テスト結果を記録する
   */
  const recordResult = (
    itemId: string,
    resultData: {
      status: ResultStatus;
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
      executedBy: string;
    },
  ) => {
    const formData = new FormData();
    formData.append("_action", "recordResult");
    formData.append("itemId", itemId);
    formData.append("data", JSON.stringify(resultData));
    fetcher.submit(formData, { method: "post" });
  };

  /**
   * データをリロードする
   */
  const reload = () => {
    revalidator.revalidate();
  };

  // Fetcherが成功したら自動的にリロード
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      revalidator.revalidate();
    }
  }, [fetcher.state, fetcher.data, revalidator]);

  return {
    run: data.run,
    items: data.items,
    summary: data.summary,
    actions: {
      start: startRun,
      complete: completeRun,
      recordResult,
      reload,
    },
    loading,
    error: fetcher.data?.error,
  };
}

/**
 * テストラン一覧データ型
 */
export type TestRunListData = ReadonlyArray<{
  readonly id: string;
  readonly status: RunStatus;
  readonly assigneeUserId: string;
  readonly buildRef?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly progress?: {
    readonly total: number;
    readonly executed: number;
    readonly passed: number;
    readonly failed: number;
  };
}>;

/**
 * useTestRunList Hook
 *
 * テストラン一覧データを提供するカスタムフック
 *
 * @example
 * ```tsx
 * function TestRunsPage() {
 *   const { runs, loading } = useTestRunList();
 *
 *   return (
 *     <div>
 *       {runs.map(run => (
 *         <TestRunCard key={run.id} run={run} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTestRunList() {
  const runs = useLoaderData<TestRunListData>();
  const revalidator = useRevalidator();

  return {
    runs,
    loading: revalidator.state === "loading",
    reload: () => revalidator.revalidate(),
  };
}
