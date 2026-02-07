import { Effect, Layer } from "effect";
import { PrismaService } from "~/../../shared/db/layers/prisma-layer";
import { TestScenarioListRepository } from "../../application/ports/test-scenario-list-repository";
import { TestScenarioList } from "../../domain/models/test-scenario-list";
import {
  TestScenarioListRevision,
  TestScenarioListItemRef,
} from "../../domain/models/test-scenario-list-revision";
import type { RevisionStatus } from "../../domain/models/revision-status";
import { TestScenarioListNotFoundError } from "../../domain/errors/test-case-errors";
import {
  RevisionCreationError,
  RevisionUpdateError,
} from "../../domain/errors/revision-errors";

/**
 * Prisma TestScenarioListRepository実装
 */
export const PrismaTestScenarioListRepository = Layer.effect(
  TestScenarioListRepository,
  Effect.gen(function* () {
    const prisma = yield* PrismaService;

    return {
      findById: (listId: string) =>
        Effect.gen(function* () {
          const list = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioList.findUnique({ where: { id: listId } }),
            catch: (error) =>
              new TestScenarioListNotFoundError({
                message: `テストシナリオリストの取得に失敗しました: ${String(error)}`,
                listId,
              }),
          });

          if (!list) {
            return yield* Effect.fail(
              new TestScenarioListNotFoundError({
                message: `テストシナリオリストが見つかりません: ${listId}`,
                listId,
              }),
            );
          }

          return new TestScenarioList({
            id: list.id,
            projectId: list.project_id,
            createdAt: list.created_at,
            updatedAt: list.updated_at,
          });
        }),

      findByProjectId: (projectId: string) =>
        Effect.gen(function* () {
          const lists = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioList.findMany({
                where: { project_id: projectId },
                orderBy: { created_at: "desc" },
              }),
            catch: (error) =>
              new Error(
                `テストシナリオリスト一覧の取得に失敗しました: ${String(error)}`,
              ),
          });

          return lists.map(
            (l) =>
              new TestScenarioList({
                id: l.id,
                projectId: l.project_id,
                createdAt: l.created_at,
                updatedAt: l.updated_at,
              }),
          );
        }),

      create: (input) =>
        Effect.gen(function* () {
          const list = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioList.create({
                data: {
                  project_id: input.projectId,
                  revisions: {
                    create: {
                      rev: 1,
                      status: "DRAFT",
                      title: input.title,
                      description: input.description ?? null,
                      test_scenarios: input.testScenarios,
                      created_by: input.createdBy,
                    },
                  },
                },
              }),
            catch: (error) =>
              new Error(
                `テストシナリオリストの作成に失敗しました: ${String(error)}`,
              ),
          });

          return new TestScenarioList({
            id: list.id,
            projectId: list.project_id,
            createdAt: list.created_at,
            updatedAt: list.updated_at,
          });
        }),

      findRevisionById: (revisionId: string) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioListRevision.findUnique({
                where: { id: revisionId },
              }),
            catch: (error) =>
              new Error(`リビジョンの取得に失敗しました: ${String(error)}`),
          });

          if (!revision) {
            return yield* Effect.fail(
              new Error(`リビジョンが見つかりません: ${revisionId}`),
            );
          }

          return new TestScenarioListRevision({
            id: revision.id,
            testScenarioListId: revision.test_scenario_list_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testScenarios: (
              revision.test_scenarios as Array<Record<string, unknown>>
            ).map(
              (ts) =>
                new TestScenarioListItemRef({
                  scenarioId: ts.scenarioId as string,
                  revisionNumber: ts.revisionNumber as number,
                  order: ts.order as number,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: revision.approved_by ?? undefined,
            approvedAt: revision.approved_at ?? undefined,
          });
        }),

      findLatestRevision: (listId: string) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioListRevision.findFirst({
                where: { test_scenario_list_id: listId },
                orderBy: { rev: "desc" },
              }),
            catch: (error) =>
              new Error(
                `最新リビジョンの取得に失敗しました: ${String(error)}`,
              ),
          });

          if (!revision) {
            return yield* Effect.fail(
              new Error(
                `リビジョンが見つかりません (テストシナリオリストID: ${listId})`,
              ),
            );
          }

          return new TestScenarioListRevision({
            id: revision.id,
            testScenarioListId: revision.test_scenario_list_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testScenarios: (
              revision.test_scenarios as Array<Record<string, unknown>>
            ).map(
              (ts) =>
                new TestScenarioListItemRef({
                  scenarioId: ts.scenarioId as string,
                  revisionNumber: ts.revisionNumber as number,
                  order: ts.order as number,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: revision.approved_by ?? undefined,
            approvedAt: revision.approved_at ?? undefined,
          });
        }),

      findAllRevisions: (listId: string) =>
        Effect.gen(function* () {
          const revisions = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioListRevision.findMany({
                where: { test_scenario_list_id: listId },
                orderBy: { rev: "desc" },
              }),
            catch: (error) =>
              new Error(
                `リビジョン一覧の取得に失敗しました: ${String(error)}`,
              ),
          });

          return revisions.map(
            (r) =>
              new TestScenarioListRevision({
                id: r.id,
                testScenarioListId: r.test_scenario_list_id,
                rev: r.rev,
                status: r.status as RevisionStatus,
                title: r.title,
                description: r.description ?? undefined,
                testScenarios: (
                  r.test_scenarios as Array<Record<string, unknown>>
                ).map(
                  (ts) =>
                    new TestScenarioListItemRef({
                      scenarioId: ts.scenarioId as string,
                      revisionNumber: ts.revisionNumber as number,
                      order: ts.order as number,
                    }),
                ),
                createdBy: r.created_by,
                createdAt: r.created_at,
                approvedBy: r.approved_by ?? undefined,
                approvedAt: r.approved_at ?? undefined,
              }),
          );
        }),

      createRevision: (input) =>
        Effect.gen(function* () {
          // 最新のリビジョン番号を取得
          const latestRev = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioListRevision.findFirst({
                where: { test_scenario_list_id: input.listId },
                orderBy: { rev: "desc" },
                select: { rev: true },
              }),
            catch: () => null,
          }).pipe(Effect.orElseSucceed(() => null));

          const nextRev = (latestRev?.rev ?? 0) + 1;

          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioListRevision.create({
                data: {
                  test_scenario_list_id: input.listId,
                  rev: nextRev,
                  status: "DRAFT",
                  title: input.title,
                  description: input.description ?? null,
                  test_scenarios: input.testScenarios,
                  created_by: input.createdBy,
                },
              }),
            catch: (error) =>
              new RevisionCreationError({
                message: `リビジョンの作成に失敗しました: ${String(error)}`,
                cause: error,
              }),
          });

          return new TestScenarioListRevision({
            id: revision.id,
            testScenarioListId: revision.test_scenario_list_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testScenarios: (
              revision.test_scenarios as Array<Record<string, unknown>>
            ).map(
              (ts) =>
                new TestScenarioListItemRef({
                  scenarioId: ts.scenarioId as string,
                  revisionNumber: ts.revisionNumber as number,
                  order: ts.order as number,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
          });
        }),

      updateRevision: (revisionId, input) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioListRevision.update({
                where: { id: revisionId },
                data: {
                  title: input.title,
                  description:
                    input.description !== undefined
                      ? input.description
                      : undefined,
                  test_scenarios: input.testScenarios as never,
                  status: input.status,
                },
              }),
            catch: (error) =>
              new RevisionUpdateError({
                message: `リビジョンの更新に失敗しました: ${String(error)}`,
                revisionId,
                cause: error,
              }),
          });

          return new TestScenarioListRevision({
            id: revision.id,
            testScenarioListId: revision.test_scenario_list_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testScenarios: (
              revision.test_scenarios as Array<Record<string, unknown>>
            ).map(
              (ts) =>
                new TestScenarioListItemRef({
                  scenarioId: ts.scenarioId as string,
                  revisionNumber: ts.revisionNumber as number,
                  order: ts.order as number,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: revision.approved_by ?? undefined,
            approvedAt: revision.approved_at ?? undefined,
          });
        }),

      updateRevisionStatus: (revisionId, status, userId) =>
        Effect.gen(function* () {
          const now = new Date();
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioListRevision.update({
                where: { id: revisionId },
                data: {
                  status,
                  ...(status === "APPROVED" && userId
                    ? { approved_by: userId, approved_at: now }
                    : {}),
                },
              }),
            catch: (error) =>
              new RevisionUpdateError({
                message: `ステータスの更新に失敗しました: ${String(error)}`,
                revisionId,
                cause: error,
              }),
          });

          return new TestScenarioListRevision({
            id: revision.id,
            testScenarioListId: revision.test_scenario_list_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testScenarios: (
              revision.test_scenarios as Array<Record<string, unknown>>
            ).map(
              (ts) =>
                new TestScenarioListItemRef({
                  scenarioId: ts.scenarioId as string,
                  revisionNumber: ts.revisionNumber as number,
                  order: ts.order as number,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: revision.approved_by ?? undefined,
            approvedAt: revision.approved_at ?? undefined,
          });
        }),

      delete: (listId: string) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioList.delete({ where: { id: listId } }),
            catch: (error) =>
              new TestScenarioListNotFoundError({
                message: `テストシナリオリストの削除に失敗しました: ${String(error)}`,
                listId,
              }),
          });
        }),
    };
  }),
);
