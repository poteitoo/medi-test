import { useState } from "react";
import { Effect } from "effect";
import type { TestCaseContent } from "../../domain/models/test-case-content";
import { TestCaseManagementLayer } from "../../infrastructure/layers/test-case-layer";
import { createTestCase } from "../../application/usecases/create-test-case";
import { createTestCaseRevision } from "../../application/usecases/create-test-case-revision";
import { submitForReview } from "../../application/usecases/submit-for-review";

/**
 * リビジョン管理フックの戻り値
 */
type UseRevisionManagementResult = {
  /**
   * テストケース作成関数
   */
  createCase: (input: {
    projectId: string;
    title: string;
    content: TestCaseContent;
    createdBy: string;
  }) => Promise<void>;

  /**
   * リビジョン作成関数
   */
  createRevision: (input: {
    caseId: string;
    title: string;
    content: TestCaseContent;
    createdBy: string;
  }) => Promise<void>;

  /**
   * レビュー提出関数
   */
  submitReview: (revisionId: string) => Promise<void>;

  /**
   * 実行中フラグ
   */
  isSubmitting: boolean;

  /**
   * エラー
   */
  error: Error | null;
};

/**
 * リビジョン管理フック
 *
 * テストケースとリビジョンの作成・管理機能を提供する
 *
 * @example
 * const { createCase, createRevision, submitReview, isSubmitting } = useRevisionManagement();
 *
 * await createCase({
 *   projectId: "project-123",
 *   title: "ログイン機能のテスト",
 *   content: new TestCaseContent({...}),
 *   createdBy: "user-456",
 * });
 */
export function useRevisionManagement(): UseRevisionManagementResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createCase = async (input: {
    projectId: string;
    title: string;
    content: TestCaseContent;
    createdBy: string;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const program = createTestCase(input).pipe(
        Effect.provide(TestCaseManagementLayer),
      );

      await Effect.runPromise(program);
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("テストケースの作成に失敗しました");
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const createRevision = async (input: {
    caseId: string;
    title: string;
    content: TestCaseContent;
    createdBy: string;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const program = createTestCaseRevision(input).pipe(
        Effect.provide(TestCaseManagementLayer),
      );

      await Effect.runPromise(program);
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("リビジョンの作成に失敗しました");
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReview = async (revisionId: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const program = submitForReview({ revisionId }).pipe(
        Effect.provide(TestCaseManagementLayer),
      );

      await Effect.runPromise(program);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("レビュー提出に失敗しました");
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createCase,
    createRevision,
    submitReview,
    isSubmitting,
    error,
  };
}
