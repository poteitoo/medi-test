import { Context, Effect } from "effect";
import type { TestScenarioList } from "../../domain/models/test-scenario-list";
import type {
  TestScenarioListRevision,
  TestScenarioListItemRef,
} from "../../domain/models/test-scenario-list-revision";
import type { RevisionStatus } from "../../domain/models/revision-status";
import type { TestScenarioListNotFoundError } from "../../domain/errors/test-case-errors";
import type {
  RevisionCreationError,
  RevisionUpdateError,
} from "../../domain/errors/revision-errors";

/**
 * TestScenarioListRepository Port
 *
 * テストシナリオリストデータへのアクセスを抽象化するポート
 */
export class TestScenarioListRepository extends Context.Tag(
  "TestScenarioListRepository",
)<
  TestScenarioListRepository,
  {
    /**
     * IDでテストシナリオリストを取得
     */
    readonly findById: (
      listId: string,
    ) => Effect.Effect<TestScenarioList, TestScenarioListNotFoundError>;

    /**
     * プロジェクトのすべてのテストシナリオリストを取得
     */
    readonly findByProjectId: (
      projectId: string,
    ) => Effect.Effect<readonly TestScenarioList[], Error>;

    /**
     * テストシナリオリストを作成
     */
    readonly create: (input: {
      readonly projectId: string;
      readonly title: string;
      readonly description?: string;
      readonly testScenarios: readonly TestScenarioListItemRef[];
      readonly createdBy: string;
    }) => Effect.Effect<TestScenarioList, Error>;

    /**
     * テストシナリオリストのリビジョンを取得
     */
    readonly findRevisionById: (
      revisionId: string,
    ) => Effect.Effect<TestScenarioListRevision, Error>;

    /**
     * テストシナリオリストの最新リビジョンを取得
     */
    readonly findLatestRevision: (
      listId: string,
    ) => Effect.Effect<TestScenarioListRevision, Error>;

    /**
     * テストシナリオリストのすべてのリビジョンを取得
     */
    readonly findAllRevisions: (
      listId: string,
    ) => Effect.Effect<readonly TestScenarioListRevision[], Error>;

    /**
     * 新しいリビジョンを作成
     */
    readonly createRevision: (input: {
      readonly listId: string;
      readonly title: string;
      readonly description?: string;
      readonly testScenarios: readonly TestScenarioListItemRef[];
      readonly createdBy: string;
    }) => Effect.Effect<TestScenarioListRevision, RevisionCreationError>;

    /**
     * リビジョンを更新
     */
    readonly updateRevision: (
      revisionId: string,
      input: {
        readonly title?: string;
        readonly description?: string;
        readonly testScenarios?: readonly TestScenarioListItemRef[];
        readonly status?: RevisionStatus;
      },
    ) => Effect.Effect<TestScenarioListRevision, RevisionUpdateError>;

    /**
     * リビジョンのステータスを更新
     */
    readonly updateRevisionStatus: (
      revisionId: string,
      status: RevisionStatus,
      userId?: string,
    ) => Effect.Effect<TestScenarioListRevision, RevisionUpdateError>;

    /**
     * テストシナリオリストを削除
     */
    readonly delete: (
      listId: string,
    ) => Effect.Effect<void, TestScenarioListNotFoundError>;
  }
>() {}
