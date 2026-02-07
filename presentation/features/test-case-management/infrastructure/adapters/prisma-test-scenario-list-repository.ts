import { Effect, Layer } from "effect";
import { Database } from "@shared/db/layers/prisma-layer";
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
    const prisma = yield* Database;

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
            testScenarioListId: revision.list_stable_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testScenarios: [],
            createdBy: revision.created_by,
            createdAt: revision.created_at,
          });
        }),

      findLatestRevision: (listId: string) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioListRevision.findFirst({
                where: { list_stable_id: listId },
                orderBy: { rev: "desc" },
              }),
            catch: (error) =>
              new Error(`最新リビジョンの取得に失敗しました: ${String(error)}`),
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
            testScenarioListId: revision.list_stable_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testScenarios: [],
            createdBy: revision.created_by,
            createdAt: revision.created_at,
          });
        }),

      findAllRevisions: (listId: string) =>
        Effect.gen(function* () {
          const revisions = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioListRevision.findMany({
                where: { list_stable_id: listId },
                orderBy: { rev: "desc" },
              }),
            catch: (error) =>
              new Error(`リビジョン一覧の取得に失敗しました: ${String(error)}`),
          });

          return revisions.map(
            (r) =>
              new TestScenarioListRevision({
                id: r.id,
                testScenarioListId: r.list_stable_id,
                rev: r.rev,
                status: r.status as RevisionStatus,
                title: r.title,
                description: r.description ?? undefined,
                testScenarios: [],
                createdBy: r.created_by,
                createdAt: r.created_at,
              }),
          );
        }),

      createRevision: (input) =>
        Effect.gen(function* () {
          // 最新のリビジョン番号を取得
          const latestRev = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioListRevision.findFirst({
                where: { list_stable_id: input.listId },
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
                  list_stable_id: input.listId,
                  rev: nextRev,
                  status: "DRAFT",
                  title: input.title,
                  description: input.description ?? null,
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
            testScenarioListId: revision.list_stable_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testScenarios: [],
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
            testScenarioListId: revision.list_stable_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testScenarios: [],
            createdBy: revision.created_by,
            createdAt: revision.created_at,
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
            testScenarioListId: revision.list_stable_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testScenarios: [],
            createdBy: revision.created_by,
            createdAt: revision.created_at,
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
