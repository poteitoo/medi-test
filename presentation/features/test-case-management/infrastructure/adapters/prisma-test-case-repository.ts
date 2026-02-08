import { Effect, Layer } from "effect";
import type { PrismaClient } from "@prisma/client";
import { Database, PrismaLayer } from "@shared/db/layers/prisma-layer";
import { TestCaseRepository } from "../../application/ports/test-case-repository";
import type { PaginationOptions } from "../../application/ports/test-case-repository";
import { TestCase } from "../../domain/models/test-case";
import { TestCaseRevision } from "../../domain/models/test-case-revision";
import type { Json } from "../../domain/models/test-case-revision";
import type { RevisionStatus } from "../../domain/models/revision-status";
import { canTransitionTo } from "../../domain/models/revision-status";
import {
  TestStep,
  TestCaseContent,
  type TestCasePriority,
} from "../../domain/models/test-case-content";
import type { TestCaseContent as TestCaseContentType } from "../../domain/models/test-case-content";
import {
  TestCaseNotFoundError,
  TestCaseCreationError,
} from "../../domain/errors/test-case-errors";
import {
  RevisionCreationError,
  RevisionImmutableError,
} from "../../domain/errors/revision-errors";
import { InvalidStatusTransitionError } from "../../domain/errors/status-errors";

/**
 * PrismaのJSON型からTestCaseContentに変換
 *
 * データベースのJSONB型（snake_case）をドメインモデルTestCaseContent（camelCase）に変換します。
 *
 * @param json - Prismaのcontent JSONB
 * @returns TestCaseContent ドメインモデル
 */
const mapContentFromJson = (json: unknown): TestCaseContentType => {
  const obj = json as {
    steps: Array<{
      stepNumber: number;
      action: string;
      expectedOutcome: string;
    }>;
    expectedResult: string;
    tags: string[];
    priority: TestCasePriority;
    environment: string;
    preconditions?: string;
    testData?: string;
    attachments?: string[];
    notes?: string;
  };

  const steps = obj.steps.map(
    (step) =>
      new TestStep({
        stepNumber: step.stepNumber,
        action: step.action,
        expectedOutcome: step.expectedOutcome,
      }),
  );

  return new TestCaseContent({
    steps,
    expectedResult: obj.expectedResult,
    tags: obj.tags,
    priority: obj.priority,
    environment: obj.environment,
    preconditions: obj.preconditions,
    testData: obj.testData,
    attachments: obj.attachments,
    notes: obj.notes,
  });
};

/**
 * TestCaseContentをPrismaのJSON型に変換
 *
 * ドメインモデルTestCaseContent（camelCase）をデータベースのJSONB型（snake_case）に変換します。
 *
 * @param content - TestCaseContent ドメインモデル
 * @returns Prisma JSON オブジェクト
 */
const mapContentToJson = (content: TestCaseContentType) => {
  return {
    steps: content.steps.map((step) => ({
      stepNumber: step.stepNumber,
      action: step.action,
      expectedOutcome: step.expectedOutcome,
    })),
    expectedResult: content.expectedResult,
    tags: [...content.tags],
    priority: content.priority,
    environment: content.environment,
    preconditions: content.preconditions,
    testData: content.testData,
    attachments: content.attachments ? [...content.attachments] : undefined,
    notes: content.notes,
  };
};

/**
 * PrismaのTestCaseRevisionをドメインモデルに変換
 *
 * データベースのtest_case_revisionレコード（snake_case）をドメインモデルTestCaseRevision（camelCase）に変換します。
 *
 * @param prismaRevision - Prismaの test_case_revision レコード
 * @returns TestCaseRevision ドメインモデル
 */
const mapPrismaToTestCaseRevision = (prismaRevision: {
  id: string;
  case_stable_id: string;
  rev: number;
  status: string;
  title: string;
  content: unknown;
  diff: unknown;
  reason: string | null;
  created_by: string;
  created_at: Date;
}): TestCaseRevision => {
  return new TestCaseRevision({
    id: prismaRevision.id,
    caseStableId: prismaRevision.case_stable_id,
    rev: prismaRevision.rev,
    status: prismaRevision.status as RevisionStatus,
    title: prismaRevision.title,
    content: mapContentFromJson(prismaRevision.content),
    diff:
      prismaRevision.diff !== null && prismaRevision.diff !== undefined
        ? (prismaRevision.diff as Json)
        : undefined,
    reason: prismaRevision.reason ?? undefined,
    createdBy: prismaRevision.created_by,
    createdAt: prismaRevision.created_at,
  });
};

/**
 * PrismaのTestCaseをドメインモデルに変換
 *
 * データベースのtest_caseレコード（snake_case）をドメインモデルTestCase（camelCase）に変換します。
 *
 * @param prismaTestCase - Prismaの test_case レコード
 * @returns TestCase ドメインモデル
 */
const mapPrismaToTestCase = (prismaTestCase: {
  id: string;
  project_id: string;
  created_at: Date;
}): TestCase => {
  return new TestCase({
    id: prismaTestCase.id,
    projectId: prismaTestCase.project_id,
    createdAt: prismaTestCase.created_at,
  });
};

/**
 * Prisma TestCaseRepository 実装
 *
 * PrismaClientを使用してTestCaseRepositoryポートを実装します。
 * データベースのsnake_case命名とドメインのcamelCase命名の変換を行います。
 *
 * すべてのメソッドはポートインターフェースの仕様に従って実装されています。
 */
const PrismaTestCaseRepositoryImpl = Effect.gen(function* () {
  const prisma: PrismaClient = yield* Database;

  return TestCaseRepository.of({
    /**
     * 新規テストケースを作成
     *
     * プロジェクトに紐づく新しいテストケースを作成します。
     * 初期リビジョン（rev=1）も同時に生成されます。
     */
    create: (projectId: string, createdBy: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () =>
            prisma.testCase.create({
              data: {
                project_id: projectId,
                revisions: {
                  create: {
                    rev: 1,
                    status: "DRAFT",
                    title: "新規テストケース",
                    content: mapContentToJson(
                      new TestCaseContent({
                        steps: [],
                        expectedResult: "",
                        tags: [],
                        priority: "MEDIUM",
                        environment: "staging",
                      }),
                    ),
                    created_by: createdBy,
                  },
                },
              },
            }),
          catch: (error) =>
            new TestCaseCreationError({
              message: "テストケースの作成に失敗しました",
              cause: error,
            }),
        });

        return mapPrismaToTestCase(result);
      }),

    /**
     * IDでテストケースを検索
     */
    findById: (caseId: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () =>
            prisma.testCase.findUnique({
              where: { id: caseId },
            }),
          catch: () => new Error("Database query failed"),
        }).pipe(Effect.orElseSucceed(() => null));

        return result ? mapPrismaToTestCase(result) : null;
      }),

    /**
     * プロジェクトIDでテストケース一覧を取得
     */
    findByProjectId: (projectId: string, options?: PaginationOptions) =>
      Effect.gen(function* () {
        const results = yield* Effect.tryPromise({
          try: () =>
            prisma.testCase.findMany({
              where: { project_id: projectId },
              orderBy: { created_at: "desc" },
              skip: options?.offset ?? 0,
              take: options?.limit,
            }),
          catch: () => new Error("Database query failed"),
        }).pipe(Effect.orElseSucceed(() => []));

        return results.map(mapPrismaToTestCase);
      }),

    /**
     * テストケースの新規リビジョンを作成
     */
    createRevision: (
      caseId: string,
      data: {
        readonly title: string;
        readonly content: TestCaseContentType;
        readonly reason: string;
        readonly createdBy: string;
      },
    ) =>
      Effect.gen(function* () {
        // テストケースの存在確認
        const testCase = yield* Effect.tryPromise({
          try: () =>
            prisma.testCase.findUnique({
              where: { id: caseId },
              include: {
                revisions: {
                  orderBy: { rev: "desc" },
                  take: 1,
                },
              },
            }),
          catch: (error) =>
            new TestCaseNotFoundError({
              caseId,
              message: "テストケースが見つかりません",
            }),
        });

        if (!testCase) {
          return yield* Effect.fail(
            new TestCaseNotFoundError({
              caseId,
              message: "テストケースが見つかりません",
            }),
          );
        }

        // 次のリビジョン番号を計算
        const nextRev = (testCase.revisions[0]?.rev ?? 0) + 1;

        // 新規リビジョンを作成
        const revision = yield* Effect.tryPromise({
          try: () =>
            prisma.testCaseRevision.create({
              data: {
                case_stable_id: caseId,
                rev: nextRev,
                status: "DRAFT",
                title: data.title,
                content: mapContentToJson(data.content),
                reason: data.reason,
                created_by: data.createdBy,
              },
            }),
          catch: (error) =>
            new RevisionCreationError({
              message: "リビジョンの作成に失敗しました",
              cause: error,
            }),
        });

        return mapPrismaToTestCaseRevision(revision);
      }),

    /**
     * リビジョンIDでリビジョンを検索
     */
    findRevisionById: (revisionId: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.promise(() =>
          prisma.testCaseRevision.findUnique({
            where: { id: revisionId },
          }),
        );

        return result ? mapPrismaToTestCaseRevision(result) : null;
      }),

    /**
     * テストケースの最新リビジョンを取得
     */
    findLatestRevision: (caseId: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.promise(() =>
          prisma.testCaseRevision.findFirst({
            where: { case_stable_id: caseId },
            orderBy: { rev: "desc" },
          }),
        );

        return result ? mapPrismaToTestCaseRevision(result) : null;
      }),

    /**
     * テストケースのリビジョン履歴を取得
     */
    findRevisionHistory: (caseId: string, options?: PaginationOptions) =>
      Effect.gen(function* () {
        const results = yield* Effect.tryPromise({
          try: () =>
            prisma.testCaseRevision.findMany({
              where: { case_stable_id: caseId },
              orderBy: { rev: "desc" },
              skip: options?.offset ?? 0,
              take: options?.limit,
            }),
          catch: () => new Error("Database query failed"),
        }).pipe(Effect.orElseSucceed(() => []));

        return results.map(mapPrismaToTestCaseRevision);
      }),

    /**
     * リビジョンのステータスを更新
     */
    updateRevisionStatus: (revisionId: string, status: RevisionStatus) =>
      Effect.gen(function* () {
        // 現在のリビジョンを取得
        const currentRevision = yield* Effect.tryPromise({
          try: () =>
            prisma.testCaseRevision.findUnique({
              where: { id: revisionId },
            }),
          catch: (error) =>
            new RevisionImmutableError({
              revisionId,
              status: "UNKNOWN",
              message: "リビジョンが見つかりません",
            }),
        });

        if (!currentRevision) {
          return yield* Effect.fail(
            new RevisionImmutableError({
              revisionId,
              status: "UNKNOWN",
              message: "リビジョンが見つかりません",
            }),
          );
        }

        const currentStatus = currentRevision.status as RevisionStatus;

        // ステータス遷移の検証
        if (!canTransitionTo(currentStatus, status)) {
          return yield* Effect.fail(
            new InvalidStatusTransitionError({
              from: currentStatus,
              to: status,
              message: `無効なステータス遷移です: ${currentStatus} → ${status}`,
            }),
          );
        }

        // ステータス更新
        const updated = yield* Effect.tryPromise({
          try: () =>
            prisma.testCaseRevision.update({
              where: { id: revisionId },
              data: { status },
            }),
          catch: (error) =>
            new RevisionImmutableError({
              revisionId,
              status: currentStatus,
              message: "リビジョンのステータス更新に失敗しました",
            }),
        });

        return mapPrismaToTestCaseRevision(updated);
      }),

    /**
     * テストケースを削除
     */
    deleteCase: (caseId: string) =>
      Effect.gen(function* () {
        yield* Effect.tryPromise({
          try: () =>
            prisma.testCase.delete({
              where: { id: caseId },
            }),
          catch: (error) =>
            new TestCaseNotFoundError({
              caseId,
              message: "テストケースが見つかりません",
            }),
        });

        return undefined;
      }),
  });
});

/**
 * Prisma TestCaseRepository Layer (Live)
 *
 * 本番用のPrismaClientを使用したTestCaseRepositoryの実装を提供するLayer。
 * PrismaLayerに依存し、Database tagを使用してPrismaClientにアクセスします。
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import { TestCaseRepository } from "../application/ports/test-case-repository";
 * import { PrismaTestCaseRepositoryLive } from "../infrastructure/adapters/prisma-test-case-repository";
 *
 * const program = Effect.gen(function* () {
 *   const repo = yield* TestCaseRepository;
 *   const testCase = yield* repo.create("proj-123", "user-456");
 *   return testCase;
 * }).pipe(Effect.provide(PrismaTestCaseRepositoryLive));
 *
 * await Effect.runPromise(program);
 * ```
 */
export const PrismaTestCaseRepositoryLive = Layer.effect(
  TestCaseRepository,
  PrismaTestCaseRepositoryImpl,
).pipe(Layer.provide(PrismaLayer));
