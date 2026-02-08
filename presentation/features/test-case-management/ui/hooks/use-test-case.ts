import { useState, useCallback } from "react";
import { Effect } from "effect";
import type { TestCase } from "../../domain/models/test-case";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";
import type { TestCaseContent } from "../../domain/models/test-case-content";
import { TestCaseManagementLayer } from "../../infrastructure/layers/test-case-layer";
import { listTestCases } from "../../application/usecases/list-test-cases";
import type { TestCaseWithLatestRevision } from "../../application/usecases/list-test-cases";
import { createTestCase } from "../../application/usecases/create-test-case";
import { createTestCaseRevision } from "../../application/usecases/create-test-case-revision";
import { submitForReview } from "../../application/usecases/submit-for-review";
import { TestCaseRepository } from "../../application/ports/test-case-repository";

/**
 * テストケース操作用React Hook
 *
 * テストケースの取得、作成、リビジョン作成、レビュー提出などの操作を提供します。
 * Effect TSプログラムをReactコンポーネントで利用可能な形式に変換します。
 *
 * @example
 * ```tsx
 * function TestCaseList() {
 *   const {
 *     testCases,
 *     loading,
 *     error,
 *     fetchTestCases,
 *     createTestCase,
 *   } = useTestCase();
 *
 *   useEffect(() => {
 *     fetchTestCases("proj-123");
 *   }, []);
 *
 *   const handleCreate = async () => {
 *     await createTestCase("proj-123", "user-456", {
 *       title: "新しいテスト",
 *       content: new TestCaseContent({...}),
 *     });
 *   };
 *
 *   return <div>{testCases.length}件のテストケース</div>;
 * }
 * ```
 */
export function useTestCase() {
  const [testCases, setTestCases] = useState<
    readonly (TestCase | TestCaseWithLatestRevision)[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * プロジェクトのテストケース一覧を取得
   *
   * @param projectId - プロジェクトID
   * @param options - 取得オプション
   * @returns Promise<void>
   */
  const fetchTestCases = useCallback(
    async (
      projectId: string,
      options?: {
        readonly limit?: number;
        readonly offset?: number;
        readonly includeLatestRevision?: boolean;
      },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const program = listTestCases(projectId, options).pipe(
          Effect.provide(TestCaseManagementLayer),
        ) as Effect.Effect<
          readonly TestCase[] | readonly TestCaseWithLatestRevision[]
        >;
        const result = await Effect.runPromise(program);
        setTestCases(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * 単一のテストケースを取得
   *
   * @param caseId - テストケースID
   * @returns Promise<TestCase | null>
   */
  const fetchTestCase = useCallback(async (caseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const program = TestCaseRepository.pipe(
        Effect.andThen((repo) => repo.findById(caseId)),
        Effect.provide(TestCaseManagementLayer),
      ) as Effect.Effect<TestCase | null>;
      const result = await Effect.runPromise(program);
      return result;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 新しいテストケースを作成
   *
   * @param projectId - プロジェクトID
   * @param createdBy - 作成者のユーザーID
   * @param data - テストケースデータ
   * @returns Promise<TestCaseRevision | null>
   */
  const createCase = useCallback(
    async (
      projectId: string,
      createdBy: string,
      data: {
        readonly title: string;
        readonly content: TestCaseContent;
        readonly reason?: string;
      },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const program = createTestCase(projectId, createdBy, data).pipe(
          Effect.provide(TestCaseManagementLayer),
        ) as Effect.Effect<TestCaseRevision>;
        const result = await Effect.runPromise(program);
        return result;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * 新しいリビジョンを作成
   *
   * @param caseId - テストケースID
   * @param data - リビジョンデータ
   * @returns Promise<TestCaseRevision | null>
   */
  const createRevision = useCallback(
    async (
      caseId: string,
      data: {
        readonly title: string;
        readonly content: TestCaseContent;
        readonly reason: string;
        readonly createdBy: string;
      },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const program = createTestCaseRevision(caseId, data).pipe(
          Effect.provide(TestCaseManagementLayer),
        ) as Effect.Effect<TestCaseRevision>;
        const result = await Effect.runPromise(program);
        return result;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * リビジョンをレビューに提出
   *
   * @param revisionId - リビジョンID
   * @param submittedBy - 提出者のユーザーID
   * @returns Promise<TestCaseRevision | null>
   */
  const submitForReviewAction = useCallback(
    async (revisionId: string, submittedBy: string) => {
      setLoading(true);
      setError(null);
      try {
        const program = submitForReview(revisionId, submittedBy).pipe(
          Effect.provide(TestCaseManagementLayer),
        ) as Effect.Effect<TestCaseRevision>;
        const result = await Effect.runPromise(program);
        return result;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    testCases,
    loading,
    error,
    fetchTestCases,
    fetchTestCase,
    createTestCase: createCase,
    createRevision,
    submitForReview: submitForReviewAction,
  };
}
