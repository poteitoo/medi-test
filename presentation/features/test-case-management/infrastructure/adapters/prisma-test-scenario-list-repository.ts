import { Effect, Layer } from "effect";
import type { PrismaClient } from "@prisma/client";
import { Database, PrismaLayer } from "@shared/db/layers/prisma-layer";
import { TestScenarioListRepository } from "../../application/ports/test-scenario-list-repository";
import type { PaginationOptions } from "../../application/ports/test-scenario-list-repository";
import { TestScenarioList } from "../../domain/models/test-scenario-list";
import {
  TestScenarioListRevision,
  TestScenarioListItem,
} from "../../domain/models/test-scenario-list-revision";
import type { RevisionStatus } from "../../domain/models/revision-status";
import { canTransitionTo } from "../../domain/models/revision-status";
import type { Json } from "../../domain/models/test-case-revision";
import { TestScenarioListNotFoundError } from "../../domain/errors/test-case-errors";
import {
  RevisionCreationError,
  RevisionImmutableError,
} from "../../domain/errors/revision-errors";
import { InvalidStatusTransitionError } from "../../domain/errors/status-errors";

/**
 * PrismaのTestScenarioListItemをドメインモデルに変換
 *
 * データベースのtest_scenario_list_itemレコード（snake_case）をドメインモデルTestScenarioListItem（camelCase）に変換します。
 *
 * @param prismaItem - Prismaの test_scenario_list_item レコード
 * @returns TestScenarioListItem ドメインモデル
 */
const mapItemsFromPrisma = (
  prismaItem: {
    scenario_revision_id: string;
    order: number;
    include_rule: unknown;
  },
): TestScenarioListItem => {
  // include_ruleはJSON文字列として保存されているので、パースする
  const includeRule =
    prismaItem.include_rule !== null && prismaItem.include_rule !== undefined
      ? (typeof prismaItem.include_rule === "string"
          ? prismaItem.include_rule
          : JSON.stringify(prismaItem.include_rule))
      : undefined;

  return new TestScenarioListItem({
    scenarioRevisionId: prismaItem.scenario_revision_id,
    order: prismaItem.order,
    includeRule,
  });
};


/**
 * PrismaのTestScenarioListRevisionをドメインモデルに変換
 *
 * データベースのtest_scenario_list_revisionレコード（snake_case）をドメインモデルTestScenarioListRevision（camelCase）に変換します。
 *
 * @param prismaRevision - Prismaの test_scenario_list_revision レコード（items含む）
 * @returns TestScenarioListRevision ドメインモデル
 */
const mapPrismaToTestScenarioListRevision = (
  prismaRevision: {
    id: string;
    list_stable_id: string;
    rev: number;
    status: string;
    title: string;
    description: string | null;
    diff: unknown;
    reason: string | null;
    created_by: string;
    created_at: Date;
    items: Array<{
      scenario_revision_id: string;
      order: number;
      include_rule: unknown;
    }>;
  },
): TestScenarioListRevision => {
  const items = prismaRevision.items.map(mapItemsFromPrisma);

  return new TestScenarioListRevision({
    id: prismaRevision.id,
    listStableId: prismaRevision.list_stable_id,
    rev: prismaRevision.rev,
    status: prismaRevision.status as RevisionStatus,
    title: prismaRevision.title,
    description: prismaRevision.description ?? undefined,
    items,
    diff: (prismaRevision.diff as Json | null) ?? undefined,
    reason: prismaRevision.reason ?? undefined,
    createdBy: prismaRevision.created_by,
    createdAt: prismaRevision.created_at,
  });
};

/**
 * PrismaのTestScenarioListをドメインモデルに変換
 *
 * データベースのtest_scenario_listレコード（snake_case）をドメインモデルTestScenarioList（camelCase）に変換します。
 *
 * @param prismaTestScenarioList - Prismaの test_scenario_list レコード
 * @returns TestScenarioList ドメインモデル
 */
const mapPrismaToTestScenarioList = (
  prismaTestScenarioList: {
    id: string;
    project_id: string;
    created_at: Date;
  },
): TestScenarioList => {
  return new TestScenarioList({
    id: prismaTestScenarioList.id,
    projectId: prismaTestScenarioList.project_id,
    createdAt: prismaTestScenarioList.created_at,
  });
};

/**
 * Prisma TestScenarioListRepository 実装
 *
 * PrismaClientを使用してTestScenarioListRepositoryポートを実装します。
 * データベースのsnake_case命名とドメインのcamelCase命名の変換を行います。
 *
 * すべてのメソッドはポートインターフェースの仕様に従って実装されています。
 */
const PrismaTestScenarioListRepositoryImpl = Effect.gen(function* () {
  const prisma: PrismaClient = yield* Database;

  return TestScenarioListRepository.of({
    /**
     * 新規テストシナリオリストを作成
     *
     * プロジェクトに紐づく新しいテストシナリオリストを作成します。
     * 初期リビジョン（rev=1）も同時に生成されます。
     */
    create: (projectId: string, createdBy: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () =>
            prisma.testScenarioList.create({
              data: {
                project_id: projectId,
                revisions: {
                  create: {
                    rev: 1,
                    status: "DRAFT",
                    title: "新規テストシナリオリスト",
                    created_by: createdBy,
                  },
                },
              },
            }),
          catch: (error) =>
            new Error(
              `テストシナリオリストの作成に失敗しました: ${String(error)}`,
            ),
        });

        return mapPrismaToTestScenarioList(result);
      }),

    /**
     * IDでテストシナリオリストを検索
     */
    findById: (listId: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.promise(() =>
          prisma.testScenarioList.findUnique({
            where: { id: listId },
          }),
        );

        return result ? mapPrismaToTestScenarioList(result) : null;
      }),

    /**
     * プロジェクトIDでテストシナリオリスト一覧を取得
     */
    findByProjectId: (projectId: string, options?: PaginationOptions) =>
      Effect.gen(function* () {
        const results = yield* Effect.promise(() =>
          prisma.testScenarioList.findMany({
            where: { project_id: projectId },
            orderBy: { created_at: "desc" },
            skip: options?.offset ?? 0,
            take: options?.limit,
          }),
        );

        return results.map(mapPrismaToTestScenarioList);
      }),

    /**
     * テストシナリオリストの新規リビジョンを作成
     */
    createRevision: (
      listId: string,
      data: {
        readonly title: string;
        readonly description?: string;
        readonly items: readonly TestScenarioListItem[];
        readonly reason: string;
        readonly createdBy: string;
      },
    ) =>
      Effect.gen(function* () {
        // テストシナリオリストの存在確認
        const testScenarioList = yield* Effect.tryPromise({
          try: () =>
            prisma.testScenarioList.findUnique({
              where: { id: listId },
              include: {
                revisions: {
                  orderBy: { rev: "desc" },
                  take: 1,
                },
              },
            }),
          catch: (error) =>
            new TestScenarioListNotFoundError({
              message: "テストシナリオリストが見つかりません",
              listId,
            }),
        });

        if (!testScenarioList) {
          return yield* Effect.fail(
            new TestScenarioListNotFoundError({
              message: "テストシナリオリストが見つかりません",
              listId,
            }),
          );
        }

        // 次のリビジョン番号を計算
        const nextRev = (testScenarioList.revisions[0]?.rev ?? 0) + 1;

        // 新規リビジョンを作成
        const revision = yield* Effect.tryPromise({
          try: async () => {
            // Create items separately to avoid nested create type issues
            const createdRevision =
              await prisma.testScenarioListRevision.create({
                data: {
                  list_stable_id: listId,
                  rev: nextRev,
                  status: "DRAFT",
                  title: data.title,
                  description: data.description ?? null,
                  reason: data.reason,
                  created_by: data.createdBy,
                },
              });

            // Create items
            await Promise.all(
              data.items.map((item) =>
                prisma.testScenarioListItem.create({
                  data: {
                    list_revision_id: createdRevision.id,
                    scenario_revision_id: item.scenarioRevisionId,
                    order: item.order,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    include_rule: (item.includeRule
                      ? JSON.parse(item.includeRule)
                      : null) as any,
                  },
                }),
              ),
            );

            // Fetch with items
            const result = await prisma.testScenarioListRevision.findUnique({
              where: { id: createdRevision.id },
              include: { items: { orderBy: { order: "asc" } } },
            });

            if (!result) {
              throw new Error("Failed to fetch created revision");
            }

            return result;
          },
          catch: (error) =>
            new RevisionCreationError({
              message: "リビジョンの作成に失敗しました",
              cause: error,
            }),
        });

        return mapPrismaToTestScenarioListRevision(revision);
      }),

    /**
     * リビジョンIDでリビジョンを検索
     */
    findRevisionById: (revisionId: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.promise(() =>
          prisma.testScenarioListRevision.findUnique({
            where: { id: revisionId },
            include: {
              items: {
                orderBy: { order: "asc" },
              },
            },
          }),
        );

        return result ? mapPrismaToTestScenarioListRevision(result) : null;
      }),

    /**
     * テストシナリオリストの最新リビジョンを取得
     */
    findLatestRevision: (listId: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.promise(() =>
          prisma.testScenarioListRevision.findFirst({
            where: { list_stable_id: listId },
            orderBy: { rev: "desc" },
            include: {
              items: {
                orderBy: { order: "asc" },
              },
            },
          }),
        );

        return result ? mapPrismaToTestScenarioListRevision(result) : null;
      }),

    /**
     * テストシナリオリストのリビジョン履歴を取得
     */
    findRevisionHistory: (listId: string, options?: PaginationOptions) =>
      Effect.gen(function* () {
        const results = yield* Effect.promise(() =>
          prisma.testScenarioListRevision.findMany({
            where: { list_stable_id: listId },
            orderBy: { rev: "desc" },
            skip: options?.offset ?? 0,
            take: options?.limit,
            include: {
              items: {
                orderBy: { order: "asc" },
              },
            },
          }),
        );

        return results.map(mapPrismaToTestScenarioListRevision);
      }),

    /**
     * リビジョンのステータスを更新
     */
    updateRevisionStatus: (revisionId: string, status: RevisionStatus) =>
      Effect.gen(function* () {
        // 現在のリビジョンを取得
        const currentRevision = yield* Effect.tryPromise({
          try: () =>
            prisma.testScenarioListRevision.findUnique({
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
            prisma.testScenarioListRevision.update({
              where: { id: revisionId },
              data: { status },
              include: {
                items: {
                  orderBy: { order: "asc" },
                },
              },
            }),
          catch: (error) =>
            new RevisionImmutableError({
              revisionId,
              status: currentStatus,
              message: "リビジョンのステータス更新に失敗しました",
            }),
        });

        return mapPrismaToTestScenarioListRevision(updated);
      }),

    /**
     * テストシナリオリストを削除
     */
    deleteList: (listId: string) =>
      Effect.gen(function* () {
        yield* Effect.tryPromise({
          try: () =>
            prisma.testScenarioList.delete({
              where: { id: listId },
            }),
          catch: (error) =>
            new TestScenarioListNotFoundError({
              message: "テストシナリオリストが見つかりません",
              listId,
            }),
        });

        return undefined;
      }),
  });
});

/**
 * Prisma TestScenarioListRepository Layer (Live)
 *
 * 本番用のPrismaClientを使用したTestScenarioListRepositoryの実装を提供するLayer。
 * PrismaLayerに依存し、Database tagを使用してPrismaClientにアクセスします。
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import { TestScenarioListRepository } from "../application/ports/test-scenario-list-repository";
 * import { PrismaTestScenarioListRepositoryLive } from "../infrastructure/adapters/prisma-test-scenario-list-repository";
 *
 * const program = Effect.gen(function* () {
 *   const repo = yield* TestScenarioListRepository;
 *   const list = yield* repo.create("proj-123", "user-456");
 *   return list;
 * }).pipe(Effect.provide(PrismaTestScenarioListRepositoryLive));
 *
 * await Effect.runPromise(program);
 * ```
 */
export const PrismaTestScenarioListRepositoryLive = Layer.effect(
  TestScenarioListRepository,
  PrismaTestScenarioListRepositoryImpl,
).pipe(Layer.provide(PrismaLayer));
