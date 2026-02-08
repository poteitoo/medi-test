import { Data } from "effect";

/**
 * テストケースが見つからない場合のエラー
 *
 * 指定されたIDのテストケースがリポジトリに存在しない場合に発生します。
 *
 * @example
 * new TestCaseNotFoundError({ caseId: "TC-001" })
 */
export class TestCaseNotFoundError extends Data.TaggedError(
  "TestCaseNotFoundError",
)<{
  readonly caseId: string;
  readonly message?: string;
}> {
  /**
   * エラーメッセージを取得
   */
  get displayMessage(): string {
    return this.message ?? `テストケースが見つかりません: ${this.caseId}`;
  }
}

/**
 * テストケースが既に存在する場合のエラー
 *
 * 同じIDのテストケースを作成しようとした場合に発生します。
 *
 * @example
 * new TestCaseAlreadyExistsError({ caseId: "TC-001" })
 */
export class TestCaseAlreadyExistsError extends Data.TaggedError(
  "TestCaseAlreadyExistsError",
)<{
  readonly caseId: string;
  readonly message?: string;
}> {
  /**
   * エラーメッセージを取得
   */
  get displayMessage(): string {
    return this.message ?? `テストケースは既に存在します: ${this.caseId}`;
  }
}

/**
 * テストケースのリビジョンが見つからない場合のエラー
 *
 * 指定されたIDのリビジョンが存在しない場合に発生します。
 *
 * @example
 * new TestCaseRevisionNotFoundError({ revisionId: "rev-123" })
 */
export class TestCaseRevisionNotFoundError extends Data.TaggedError(
  "TestCaseRevisionNotFoundError",
)<{
  readonly revisionId: string;
  readonly message?: string;
}> {
  /**
   * エラーメッセージを取得
   */
  get displayMessage(): string {
    return (
      this.message ??
      `テストケースのリビジョンが見つかりません: ${this.revisionId}`
    );
  }
}

/**
 * テストシナリオが見つからない場合のエラー
 *
 * @example
 * new TestScenarioNotFoundError({ scenarioId: "TS-001", message: "シナリオが存在しません" })
 */
export class TestScenarioNotFoundError extends Data.TaggedError(
  "TestScenarioNotFoundError",
)<{
  readonly message: string;
  readonly scenarioId?: string;
}> {}

/**
 * テストシナリオリストが見つからない場合のエラー
 *
 * @example
 * new TestScenarioListNotFoundError({ listId: "TSL-001", message: "リストが存在しません" })
 */
export class TestScenarioListNotFoundError extends Data.TaggedError(
  "TestScenarioListNotFoundError",
)<{
  readonly message: string;
  readonly listId?: string;
}> {}

/**
 * テストケース作成エラー
 *
 * @example
 * new TestCaseCreationError({ message: "作成に失敗しました", cause: error })
 */
export class TestCaseCreationError extends Data.TaggedError(
  "TestCaseCreationError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * テストケース更新エラー
 *
 * @example
 * new TestCaseUpdateError({ caseId: "TC-001", message: "更新に失敗しました" })
 */
export class TestCaseUpdateError extends Data.TaggedError(
  "TestCaseUpdateError",
)<{
  readonly message: string;
  readonly caseId: string;
  readonly cause?: unknown;
}> {}
