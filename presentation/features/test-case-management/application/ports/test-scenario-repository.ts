import { Context, Effect } from "effect";
import type { TestScenario } from "../../domain/models/test-scenario";
import type {
  TestScenarioRevision,
  TestScenarioCaseRef,
} from "../../domain/models/test-scenario-revision";
import type { RevisionStatus } from "../../domain/models/revision-status";
import type { TestScenarioNotFoundError } from "../../domain/errors/test-case-errors";
import type {
  RevisionCreationError,
  RevisionUpdateError,
} from "../../domain/errors/revision-errors";

/**
 * TestScenarioRepository Port
 *
 * テストシナリオデータへのアクセスを抽象化するポート
 */
export class TestScenarioRepository extends Context.Tag(
  "TestScenarioRepository",
)<
  TestScenarioRepository,
  {
    /**
     * IDでテストシナリオを取得
     */
    readonly findById: (
      scenarioId: string,
    ) => Effect.Effect<TestScenario, TestScenarioNotFoundError>;

    /**
     * プロジェクトのすべてのテストシナリオを取得
     */
    readonly findByProjectId: (
      projectId: string,
    ) => Effect.Effect<readonly TestScenario[], Error>;

    /**
     * テストシナリオを作成
     */
    readonly create: (input: {
      readonly projectId: string;
      readonly title: string;
      readonly description?: string;
      readonly testCases: readonly TestScenarioCaseRef[];
      readonly createdBy: string;
    }) => Effect.Effect<TestScenario, Error>;

    /**
     * テストシナリオのリビジョンを取得
     */
    readonly findRevisionById: (
      revisionId: string,
    ) => Effect.Effect<TestScenarioRevision, Error>;

    /**
     * テストシナリオの最新リビジョンを取得
     */
    readonly findLatestRevision: (
      scenarioId: string,
    ) => Effect.Effect<TestScenarioRevision, Error>;

    /**
     * テストシナリオのすべてのリビジョンを取得
     */
    readonly findAllRevisions: (
      scenarioId: string,
    ) => Effect.Effect<readonly TestScenarioRevision[], Error>;

    /**
     * 新しいリビジョンを作成
     */
    readonly createRevision: (input: {
      readonly scenarioId: string;
      readonly title: string;
      readonly description?: string;
      readonly testCases: readonly TestScenarioCaseRef[];
      readonly createdBy: string;
    }) => Effect.Effect<TestScenarioRevision, RevisionCreationError>;

    /**
     * リビジョンを更新
     */
    readonly updateRevision: (
      revisionId: string,
      input: {
        readonly title?: string;
        readonly description?: string;
        readonly testCases?: readonly TestScenarioCaseRef[];
        readonly status?: RevisionStatus;
      },
    ) => Effect.Effect<TestScenarioRevision, RevisionUpdateError>;

    /**
     * リビジョンのステータスを更新
     */
    readonly updateRevisionStatus: (
      revisionId: string,
      status: RevisionStatus,
      userId?: string,
    ) => Effect.Effect<TestScenarioRevision, RevisionUpdateError>;

    /**
     * テストシナリオを削除
     */
    readonly delete: (
      scenarioId: string,
    ) => Effect.Effect<void, TestScenarioNotFoundError>;
  }
>() {}
