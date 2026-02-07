import { useState, useEffect } from "react";
import { Effect } from "effect";
import type { TestCase } from "../../domain/models/test-case";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";
import { TestCaseManagementLayer } from "../../infrastructure/layers/test-case-layer";
import { listTestCases } from "../../application/usecases/list-test-cases";
import { getTestCaseRevisionHistory } from "../../application/usecases/get-revision-history";

/**
 * テストケース取得フックの戻り値
 */
type UseTestCaseResult = {
  /**
   * テストケースのリスト
   */
  testCases: Array<{
    testCase: TestCase;
    latestRevision: TestCaseRevision;
  }>;

  /**
   * 読み込み中フラグ
   */
  isLoading: boolean;

  /**
   * エラー
   */
  error: Error | null;

  /**
   * リロード関数
   */
  reload: () => void;
};

/**
 * テストケース取得フック
 *
 * プロジェクトのテストケース一覧を取得する
 *
 * @example
 * const { testCases, isLoading, error, reload } = useTestCase("project-123");
 */
export function useTestCase(projectId: string): UseTestCaseResult {
  const [testCases, setTestCases] = useState<
    Array<{ testCase: TestCase; latestRevision: TestCaseRevision }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTestCases = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const program = listTestCases({ projectId }).pipe(
        Effect.provide(TestCaseManagementLayer),
      );

      const result = await Effect.runPromise(program);
      setTestCases(result as Array<{ testCase: TestCase; latestRevision: TestCaseRevision }>);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("テストケースの取得に失敗しました"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestCases();
  }, [projectId]);

  return {
    testCases,
    isLoading,
    error,
    reload: loadTestCases,
  };
}

/**
 * テストケース詳細取得フックの戻り値
 */
type UseTestCaseDetailResult = {
  /**
   * リビジョン履歴
   */
  revisions: readonly TestCaseRevision[];

  /**
   * 読み込み中フラグ
   */
  isLoading: boolean;

  /**
   * エラー
   */
  error: Error | null;

  /**
   * リロード関数
   */
  reload: () => void;
};

/**
 * テストケース詳細取得フック
 *
 * テストケースのリビジョン履歴を取得する
 *
 * @example
 * const { revisions, isLoading } = useTestCaseDetail("case-123");
 */
export function useTestCaseDetail(caseId: string): UseTestCaseDetailResult {
  const [revisions, setRevisions] = useState<readonly TestCaseRevision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadRevisions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const program = getTestCaseRevisionHistory({ caseId }).pipe(
        Effect.provide(TestCaseManagementLayer),
      );

      const result = await Effect.runPromise(program);
      setRevisions(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("リビジョン履歴の取得に失敗しました"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRevisions();
  }, [caseId]);

  return {
    revisions,
    isLoading,
    error,
    reload: loadRevisions,
  };
}
