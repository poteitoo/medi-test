import { Context, Effect } from "effect";
import type { TestRun } from "../../domain/models/test-run";
import type { TestRunItem } from "../../domain/models/test-run-item";
import type { RunStatus } from "../../domain/models/run-status";
import { TestRunNotFoundError } from "../../domain/errors/test-run-errors";

/**
 * TestRunRepository Port
 *
 * テスト実行のデータアクセスを抽象化するポート
 */
export class TestRunRepository extends Context.Tag("TestRunRepository")<
  TestRunRepository,
  {
    /**
     * テストランをIDで取得
     */
    readonly findById: (
      runId: string,
    ) => Effect.Effect<TestRun, TestRunNotFoundError>;

    /**
     * テストランアイテムを含めて取得
     */
    readonly findByIdWithItems: (
      runId: string,
    ) => Effect.Effect<
      { run: TestRun; items: readonly TestRunItem[] },
      TestRunNotFoundError
    >;

    /**
     * テストランを作成（テストランアイテムも自動生成）
     */
    readonly create: (input: {
      readonly runGroupId: string;
      readonly assigneeUserId: string;
      readonly sourceListRevisionId: string;
      readonly buildRef?: string;
    }) => Effect.Effect<{ run: TestRun; items: readonly TestRunItem[] }, Error>;

    /**
     * テストランのステータスを更新
     */
    readonly updateStatus: (
      runId: string,
      status: RunStatus,
    ) => Effect.Effect<TestRun, TestRunNotFoundError>;

    /**
     * リリースIDに紐づくテストランを取得
     */
    readonly findByReleaseId: (
      releaseId: string,
    ) => Effect.Effect<readonly TestRun[], Error>;

    /**
     * ラングループIDに紐づくテストランを取得
     */
    readonly findByRunGroupId: (
      runGroupId: string,
    ) => Effect.Effect<readonly TestRun[], Error>;
  }
>() {}
