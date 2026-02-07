import { Context, Effect } from "effect";
import type { TestCase } from "../../domain/models/test-case";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";
import type { TestCaseContent } from "../../domain/models/test-case-content";
import type { RevisionStatus } from "../../domain/models/revision-status";
import type {
  TestCaseNotFoundError,
  TestCaseRevisionNotFoundError,
  TestCaseCreationError,
  TestCaseUpdateError,
} from "../../domain/errors/test-case-errors";
import type {
  RevisionCreationError,
  RevisionUpdateError,
} from "../../domain/errors/revision-errors";

/**
 * TestCaseRepository Port
 *
 * テストケースデータへのアクセスを抽象化するポート
 */
export class TestCaseRepository extends Context.Tag("TestCaseRepository")<
  TestCaseRepository,
  {
    /**
     * IDでテストケースを取得
     */
    readonly findById: (
      caseId: string,
    ) => Effect.Effect<TestCase, TestCaseNotFoundError>;

    /**
     * プロジェクトのすべてのテストケースを取得
     */
    readonly findByProjectId: (
      projectId: string,
    ) => Effect.Effect<readonly TestCase[], Error>;

    /**
     * テストケースを作成
     */
    readonly create: (input: {
      readonly projectId: string;
      readonly title: string;
      readonly content: TestCaseContent;
      readonly createdBy: string;
    }) => Effect.Effect<TestCase, TestCaseCreationError>;

    /**
     * テストケースのリビジョンを取得
     */
    readonly findRevisionById: (
      revisionId: string,
    ) => Effect.Effect<TestCaseRevision, TestCaseRevisionNotFoundError>;

    /**
     * テストケースの最新リビジョンを取得
     */
    readonly findLatestRevision: (
      caseId: string,
    ) => Effect.Effect<TestCaseRevision, TestCaseRevisionNotFoundError>;

    /**
     * テストケースのすべてのリビジョンを取得
     */
    readonly findAllRevisions: (
      caseId: string,
    ) => Effect.Effect<readonly TestCaseRevision[], Error>;

    /**
     * テストケースの特定リビジョン番号を取得
     */
    readonly findRevisionByNumber: (
      caseId: string,
      revisionNumber: number,
    ) => Effect.Effect<TestCaseRevision, TestCaseRevisionNotFoundError>;

    /**
     * 新しいリビジョンを作成
     */
    readonly createRevision: (input: {
      readonly caseId: string;
      readonly title: string;
      readonly content: TestCaseContent;
      readonly createdBy: string;
    }) => Effect.Effect<TestCaseRevision, RevisionCreationError>;

    /**
     * リビジョンを更新
     */
    readonly updateRevision: (
      revisionId: string,
      input: {
        readonly title?: string;
        readonly content?: TestCaseContent;
        readonly status?: RevisionStatus;
      },
    ) => Effect.Effect<TestCaseRevision, RevisionUpdateError>;

    /**
     * リビジョンのステータスを更新
     */
    readonly updateRevisionStatus: (
      revisionId: string,
      status: RevisionStatus,
      userId?: string,
    ) => Effect.Effect<TestCaseRevision, RevisionUpdateError>;

    /**
     * テストケースを削除
     */
    readonly delete: (
      caseId: string,
    ) => Effect.Effect<void, TestCaseNotFoundError>;

    /**
     * ステータスでリビジョンを検索
     */
    readonly findRevisionsByStatus: (
      projectId: string,
      status: RevisionStatus,
    ) => Effect.Effect<readonly TestCaseRevision[], Error>;
  }
>() {}
