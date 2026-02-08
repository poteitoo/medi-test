/**
 * テストケース管理機能のドメインエラー
 *
 * このモジュールは、テストケース管理に関連する全てのドメインエラーを
 * エクスポートします。Effect TS の Data.TaggedError パターンを使用して
 * 型安全なエラーハンドリングを実現します。
 *
 * @example
 * import {
 *   TestCaseNotFoundError,
 *   InvalidStatusTransitionError
 * } from "~/features/test-case-management/domain/errors";
 *
 * // エラーの作成
 * const error = new TestCaseNotFoundError({ caseId: "TC-001" });
 *
 * // Effect プログラムでの使用
 * const program = Effect.gen(function* () {
 *   const testCase = yield* getTestCase(id).pipe(
 *     Effect.catchTag("TestCaseNotFoundError", (error) =>
 *       Effect.fail(error.displayMessage)
 *     )
 *   );
 * });
 */

// Test Case Errors
export {
  TestCaseNotFoundError,
  TestCaseAlreadyExistsError,
  TestCaseRevisionNotFoundError,
  TestScenarioNotFoundError,
  TestScenarioListNotFoundError,
  TestCaseCreationError,
  TestCaseUpdateError,
} from "./test-case-errors";

// Revision Errors
export {
  RevisionImmutableError,
  RevisionAlreadySubmittedError,
  RevisionCreationError,
  RevisionUpdateError,
  RevisionValidationError,
  RevisionNumberConflictError,
} from "./revision-errors";

// Status Errors
export {
  InvalidStatusTransitionError,
  StatusValidationError,
  StatusChangePermissionError,
  NotApprovableError,
  NotRejectableError,
} from "./status-errors";
