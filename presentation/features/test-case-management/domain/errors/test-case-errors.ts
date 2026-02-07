import { Data } from "effect";

/**
 * テストケースが見つからないエラー
 */
export class TestCaseNotFoundError extends Data.TaggedError(
  "TestCaseNotFoundError",
)<{
  readonly message: string;
  readonly caseId?: string;
}> {}

/**
 * テストケースリビジョンが見つからないエラー
 */
export class TestCaseRevisionNotFoundError extends Data.TaggedError(
  "TestCaseRevisionNotFoundError",
)<{
  readonly message: string;
  readonly revisionId?: string;
}> {}

/**
 * テストシナリオが見つからないエラー
 */
export class TestScenarioNotFoundError extends Data.TaggedError(
  "TestScenarioNotFoundError",
)<{
  readonly message: string;
  readonly scenarioId?: string;
}> {}

/**
 * テストシナリオリストが見つからないエラー
 */
export class TestScenarioListNotFoundError extends Data.TaggedError(
  "TestScenarioListNotFoundError",
)<{
  readonly message: string;
  readonly listId?: string;
}> {}

/**
 * テストケース作成エラー
 */
export class TestCaseCreationError extends Data.TaggedError(
  "TestCaseCreationError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * テストケース更新エラー
 */
export class TestCaseUpdateError extends Data.TaggedError(
  "TestCaseUpdateError",
)<{
  readonly message: string;
  readonly caseId: string;
  readonly cause?: unknown;
}> {}
