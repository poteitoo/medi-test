import { useState, useCallback } from "react";
import { Effect } from "effect";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";
import { TestCaseManagementLayer } from "../../infrastructure/layers/test-case-layer";
import { getTestCaseRevisionHistory } from "../../application/usecases/get-revision-history";
import { TestCaseRepository } from "../../application/ports/test-case-repository";

/**
 * リビジョン管理用React Hook
 *
 * テストケースのリビジョン履歴の取得、最新リビジョンの取得、
 * リビジョン間の比較などの操作を提供します。
 *
 * @example
 * ```tsx
 * function RevisionHistory() {
 *   const {
 *     revisions,
 *     latestRevision,
 *     loading,
 *     error,
 *     fetchRevisionHistory,
 *     fetchLatestRevision,
 *   } = useRevisionManagement();
 *
 *   useEffect(() => {
 *     fetchRevisionHistory("case-123");
 *   }, []);
 *
 *   return (
 *     <div>
 *       <h2>最新: {latestRevision?.title}</h2>
 *       <ul>
 *         {revisions.map(rev => (
 *           <li key={rev.id}>rev.{rev.rev}: {rev.title}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRevisionManagement() {
  const [revisions, setRevisions] = useState<readonly TestCaseRevision[]>([]);
  const [latestRevision, setLatestRevision] = useState<TestCaseRevision | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * テストケースのリビジョン履歴を取得
   *
   * 新しい順（rev降順）でソートされたリビジョン一覧を取得します。
   *
   * @param caseId - テストケースID
   * @param options - 取得オプション
   * @returns Promise<void>
   */
  const fetchRevisionHistory = useCallback(
    async (
      caseId: string,
      options?: {
        readonly limit?: number;
        readonly offset?: number;
      },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const program = getTestCaseRevisionHistory(caseId, options).pipe(
          Effect.provide(TestCaseManagementLayer),
        ) as Effect.Effect<readonly TestCaseRevision[]>;
        const result = await Effect.runPromise(program);
        setRevisions(result);
        // 最新リビジョンも更新（配列の最初の要素）
        if (result.length > 0) {
          setLatestRevision(result[0]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * テストケースの最新リビジョンのみを取得
   *
   * @param caseId - テストケースID
   * @returns Promise<TestCaseRevision | null>
   */
  const fetchLatestRevision = useCallback(async (caseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const program = TestCaseRepository.pipe(
        Effect.andThen((repo) => repo.findLatestRevision(caseId)),
        Effect.provide(TestCaseManagementLayer),
      ) as Effect.Effect<TestCaseRevision | null>;
      const result = await Effect.runPromise(program);
      setLatestRevision(result);
      return result;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 2つのリビジョン間の差分を取得
   *
   * 現在は単純に両方のリビジョンを取得します。
   * 将来的には差分計算ロジックを実装予定。
   *
   * @param rev1Id - 比較元リビジョンID
   * @param rev2Id - 比較先リビジョンID
   * @returns Promise<{ rev1: TestCaseRevision; rev2: TestCaseRevision } | null>
   */
  const compareRevisions = useCallback(
    async (rev1Id: string, rev2Id: string) => {
      setLoading(true);
      setError(null);
      try {
        const program = TestCaseRepository.pipe(
          Effect.andThen((repo) =>
            Effect.all([
              repo.findRevisionById(rev1Id),
              repo.findRevisionById(rev2Id),
            ]),
          ),
          Effect.andThen(([rev1, rev2]) => {
            if (rev1 === null || rev2 === null) {
              return Effect.succeed(null);
            }
            return Effect.succeed({ rev1, rev2 });
          }),
          Effect.provide(TestCaseManagementLayer),
        ) as Effect.Effect<{
          rev1: TestCaseRevision;
          rev2: TestCaseRevision;
        } | null>;

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
    revisions,
    latestRevision,
    loading,
    error,
    fetchRevisionHistory,
    fetchLatestRevision,
    compareRevisions,
  };
}
