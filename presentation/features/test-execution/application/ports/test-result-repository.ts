import { Context, Effect } from "effect";
import type { TestResult } from "../../domain/models/test-result";
import type { ResultStatus } from "../../domain/models/result-status";
import type { Evidence, BugLink } from "../../domain/models/test-result";

/**
 * TestResultRepository Port
 *
 * テスト結果のデータアクセスを抽象化するポート
 */
export class TestResultRepository extends Context.Tag("TestResultRepository")<
  TestResultRepository,
  {
    /**
     * テスト結果を記録
     */
    readonly create: (input: {
      readonly runItemId: string;
      readonly status: ResultStatus;
      readonly evidence?: Evidence;
      readonly bugLinks?: readonly BugLink[];
      readonly executedBy: string;
    }) => Effect.Effect<TestResult, Error>;

    /**
     * テストランアイテムの結果一覧を取得
     */
    readonly findByRunItemId: (
      runItemId: string,
    ) => Effect.Effect<readonly TestResult[], Error>;

    /**
     * テストランアイテムの最新結果を取得
     */
    readonly findLatestByRunItemId: (
      runItemId: string,
    ) => Effect.Effect<TestResult | null, Error>;

    /**
     * テストランの全結果を取得
     */
    readonly findByRunId: (
      runId: string,
    ) => Effect.Effect<readonly TestResult[], Error>;
  }
>() {}
