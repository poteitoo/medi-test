import { Effect, Layer } from "effect";
import { PrismaService } from "@shared/db/layers/prisma-layer";
import { TestRunRepository } from "../../application/ports/test-run-repository";
import { TestRun } from "../../domain/models/test-run";
import { TestRunItem } from "../../domain/models/test-run-item";
import type { RunStatus } from "../../domain/models/run-status";
import { TestRunNotFoundError } from "../../domain/errors/test-run-errors";

/**
 * Prisma TestRunRepository実装
 */
export const PrismaTestRunRepository = Layer.effect(
  TestRunRepository,
  Effect.gen(function* () {
    const prisma = yield* PrismaService;

    return {
      findById: (runId: string) =>
        Effect.gen(function* () {
          const testRun = yield* Effect.tryPromise({
            try: () =>
              prisma.testRun.findUnique({
                where: { id: runId },
              }),
            catch: (error) =>
              new TestRunNotFoundError({
                message: `テストランの取得に失敗しました: ${String(error)}`,
                runId,
              }),
          });

          if (!testRun) {
            return yield* Effect.fail(
              new TestRunNotFoundError({
                message: `テストランが見つかりません: ${runId}`,
                runId,
              }),
            );
          }

          return new TestRun({
            id: testRun.id,
            runGroupId: testRun.run_group_id,
            assigneeUserId: testRun.assignee_user_id,
            sourceListRevisionId: testRun.source_list_revision_id,
            buildRef: testRun.build_ref ?? undefined,
            status: testRun.status as RunStatus,
            createdAt: testRun.created_at,
            updatedAt: testRun.updated_at,
          });
        }),

      findByIdWithItems: (runId: string) =>
        Effect.gen(function* () {
          const testRun = yield* Effect.tryPromise({
            try: () =>
              prisma.testRun.findUnique({
                where: { id: runId },
                include: {
                  items: {
                    orderBy: { order: "asc" },
                  },
                },
              }),
            catch: (error) =>
              new TestRunNotFoundError({
                message: `テストランの取得に失敗しました: ${String(error)}`,
                runId,
              }),
          });

          if (!testRun) {
            return yield* Effect.fail(
              new TestRunNotFoundError({
                message: `テストランが見つかりません: ${runId}`,
                runId,
              }),
            );
          }

          return {
            run: new TestRun({
              id: testRun.id,
              runGroupId: testRun.run_group_id,
              assigneeUserId: testRun.assignee_user_id,
              sourceListRevisionId: testRun.source_list_revision_id,
              buildRef: testRun.build_ref ?? undefined,
              status: testRun.status as RunStatus,
              createdAt: testRun.created_at,
              updatedAt: testRun.updated_at,
            }),
            items: testRun.items.map(
              (item) =>
                new TestRunItem({
                  id: item.id,
                  runId: item.run_id,
                  caseRevisionId: item.case_revision_id,
                  originScenarioRevisionId:
                    item.origin_scenario_revision_id ?? undefined,
                  order: item.order,
                  createdAt: item.created_at,
                }),
            ),
          };
        }),

      create: (input) =>
        Effect.gen(function* () {
          // テストシナリオリストからテストケースを取得
          const listRevision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioListRevision.findUnique({
                where: { id: input.sourceListRevisionId },
                include: {
                  items: {
                    include: {
                      scenario_revision: {
                        include: {
                          items: {
                            orderBy: { order: "asc" },
                          },
                        },
                      },
                    },
                    orderBy: { order: "asc" },
                  },
                },
              }),
            catch: (error) =>
              new Error(
                `テストシナリオリストの取得に失敗しました: ${String(error)}`,
              ),
          });

          if (!listRevision) {
            return yield* Effect.fail(
              new Error(
                `テストシナリオリストが見つかりません: ${input.sourceListRevisionId}`,
              ),
            );
          }

          // テストランとアイテムを作成
          const result = yield* Effect.tryPromise({
            try: async () => {
              // テストケースを展開
              const testCases: Array<{
                caseRevisionId: string;
                originScenarioRevisionId: string;
                order: number;
              }> = [];

              let order = 0;
              for (const listItem of listRevision.items) {
                for (const scenarioItem of listItem.scenario_revision.items) {
                  testCases.push({
                    caseRevisionId: scenarioItem.case_revision_id,
                    originScenarioRevisionId: listItem.scenario_revision_id,
                    order: order++,
                  });
                }
              }

              // トランザクションでテストランとアイテムを作成
              return await prisma.$transaction(async (tx) => {
                const testRun = await tx.testRun.create({
                  data: {
                    run_group_id: input.runGroupId,
                    assignee_user_id: input.assigneeUserId,
                    source_list_revision_id: input.sourceListRevisionId,
                    build_ref: input.buildRef,
                    status: "ASSIGNED",
                  },
                });

                const items = await Promise.all(
                  testCases.map((tc) =>
                    tx.testRunItem.create({
                      data: {
                        run_id: testRun.id,
                        case_revision_id: tc.caseRevisionId,
                        origin_scenario_revision_id: tc.originScenarioRevisionId,
                        order: tc.order,
                      },
                    }),
                  ),
                );

                return { testRun, items };
              });
            },
            catch: (error) =>
              new Error(`テストランの作成に失敗しました: ${String(error)}`),
          });

          return {
            run: new TestRun({
              id: result.testRun.id,
              runGroupId: result.testRun.run_group_id,
              assigneeUserId: result.testRun.assignee_user_id,
              sourceListRevisionId: result.testRun.source_list_revision_id,
              buildRef: result.testRun.build_ref ?? undefined,
              status: result.testRun.status as RunStatus,
              createdAt: result.testRun.created_at,
              updatedAt: result.testRun.updated_at,
            }),
            items: result.items.map(
              (item) =>
                new TestRunItem({
                  id: item.id,
                  runId: item.run_id,
                  caseRevisionId: item.case_revision_id,
                  originScenarioRevisionId:
                    item.origin_scenario_revision_id ?? undefined,
                  order: item.order,
                  createdAt: item.created_at,
                }),
            ),
          };
        }),

      updateStatus: (runId: string, status: RunStatus) =>
        Effect.gen(function* () {
          const testRun = yield* Effect.tryPromise({
            try: () =>
              prisma.testRun.update({
                where: { id: runId },
                data: { status },
              }),
            catch: (error) =>
              new TestRunNotFoundError({
                message: `テストランステータスの更新に失敗しました: ${String(error)}`,
                runId,
              }),
          });

          return new TestRun({
            id: testRun.id,
            runGroupId: testRun.run_group_id,
            assigneeUserId: testRun.assignee_user_id,
            sourceListRevisionId: testRun.source_list_revision_id,
            buildRef: testRun.build_ref ?? undefined,
            status: testRun.status as RunStatus,
            createdAt: testRun.created_at,
            updatedAt: testRun.updated_at,
          });
        }),

      findByReleaseId: (releaseId: string) =>
        Effect.gen(function* () {
          const testRuns = yield* Effect.tryPromise({
            try: () =>
              prisma.testRun.findMany({
                where: {
                  run_group: {
                    release_id: releaseId,
                  },
                },
                orderBy: { created_at: "desc" },
              }),
            catch: (error) =>
              new Error(`テストラン一覧の取得に失敗しました: ${String(error)}`),
          });

          return testRuns.map(
            (tr) =>
              new TestRun({
                id: tr.id,
                runGroupId: tr.run_group_id,
                assigneeUserId: tr.assignee_user_id,
                sourceListRevisionId: tr.source_list_revision_id,
                buildRef: tr.build_ref ?? undefined,
                status: tr.status as RunStatus,
                createdAt: tr.created_at,
                updatedAt: tr.updated_at,
              }),
          );
        }),

      findByRunGroupId: (runGroupId: string) =>
        Effect.gen(function* () {
          const testRuns = yield* Effect.tryPromise({
            try: () =>
              prisma.testRun.findMany({
                where: { run_group_id: runGroupId },
                orderBy: { created_at: "desc" },
              }),
            catch: (error) =>
              new Error(`テストラン一覧の取得に失敗しました: ${String(error)}`),
          });

          return testRuns.map(
            (tr) =>
              new TestRun({
                id: tr.id,
                runGroupId: tr.run_group_id,
                assigneeUserId: tr.assignee_user_id,
                sourceListRevisionId: tr.source_list_revision_id,
                buildRef: tr.build_ref ?? undefined,
                status: tr.status as RunStatus,
                createdAt: tr.created_at,
                updatedAt: tr.updated_at,
              }),
          );
        }),
    };
  }),
);
