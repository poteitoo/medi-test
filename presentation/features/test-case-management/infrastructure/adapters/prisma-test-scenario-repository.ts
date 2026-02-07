import { Effect, Layer } from "effect";
import { PrismaService } from "~/../../shared/db/layers/prisma-layer";
import { TestScenarioRepository } from "../../application/ports/test-scenario-repository";
import { TestScenario } from "../../domain/models/test-scenario";
import {
  TestScenarioRevision,
  TestScenarioCaseRef,
} from "../../domain/models/test-scenario-revision";
import type { RevisionStatus } from "../../domain/models/revision-status";
import { TestScenarioNotFoundError } from "../../domain/errors/test-case-errors";
import {
  RevisionCreationError,
  RevisionUpdateError,
} from "../../domain/errors/revision-errors";

/**
 * Prisma TestScenarioRepository実装
 */
export const PrismaTestScenarioRepository = Layer.effect(
  TestScenarioRepository,
  Effect.gen(function* () {
    const prisma = yield* PrismaService;

    return {
      findById: (scenarioId: string) =>
        Effect.gen(function* () {
          const scenario = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenario.findUnique({ where: { id: scenarioId } }),
            catch: (error) =>
              new TestScenarioNotFoundError({
                message: `テストシナリオの取得に失敗しました: ${String(error)}`,
                scenarioId,
              }),
          });

          if (!scenario) {
            return yield* Effect.fail(
              new TestScenarioNotFoundError({
                message: `テストシナリオが見つかりません: ${scenarioId}`,
                scenarioId,
              }),
            );
          }

          return new TestScenario({
            id: scenario.id,
            projectId: scenario.project_id,
            createdAt: scenario.created_at,
            updatedAt: scenario.updated_at,
          });
        }),

      findByProjectId: (projectId: string) =>
        Effect.gen(function* () {
          const scenarios = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenario.findMany({
                where: { project_id: projectId },
                orderBy: { created_at: "desc" },
              }),
            catch: (error) =>
              new Error(
                `テストシナリオ一覧の取得に失敗しました: ${String(error)}`,
              ),
          });

          return scenarios.map(
            (s) =>
              new TestScenario({
                id: s.id,
                projectId: s.project_id,
                createdAt: s.created_at,
                updatedAt: s.updated_at,
              }),
          );
        }),

      create: (input) =>
        Effect.gen(function* () {
          const scenario = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenario.create({
                data: {
                  project_id: input.projectId,
                  revisions: {
                    create: {
                      rev: 1,
                      status: "DRAFT",
                      title: input.title,
                      description: input.description ?? null,
                      test_cases: input.testCases,
                      created_by: input.createdBy,
                    },
                  },
                },
              }),
            catch: (error) =>
              new Error(
                `テストシナリオの作成に失敗しました: ${String(error)}`,
              ),
          });

          return new TestScenario({
            id: scenario.id,
            projectId: scenario.project_id,
            createdAt: scenario.created_at,
            updatedAt: scenario.updated_at,
          });
        }),

      findRevisionById: (revisionId: string) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioRevision.findUnique({
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

          return new TestScenarioRevision({
            id: revision.id,
            testScenarioId: revision.test_scenario_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testCases: (revision.test_cases as Array<Record<string, unknown>>).map(
              (tc) =>
                new TestScenarioCaseRef({
                  caseId: tc.caseId as string,
                  revisionNumber: tc.revisionNumber as number,
                  order: tc.order as number,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: revision.approved_by ?? undefined,
            approvedAt: revision.approved_at ?? undefined,
          });
        }),

      findLatestRevision: (scenarioId: string) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioRevision.findFirst({
                where: { test_scenario_id: scenarioId },
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
                `リビジョンが見つかりません (テストシナリオID: ${scenarioId})`,
              ),
            );
          }

          return new TestScenarioRevision({
            id: revision.id,
            testScenarioId: revision.test_scenario_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testCases: (revision.test_cases as Array<Record<string, unknown>>).map(
              (tc) =>
                new TestScenarioCaseRef({
                  caseId: tc.caseId as string,
                  revisionNumber: tc.revisionNumber as number,
                  order: tc.order as number,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: revision.approved_by ?? undefined,
            approvedAt: revision.approved_at ?? undefined,
          });
        }),

      findAllRevisions: (scenarioId: string) =>
        Effect.gen(function* () {
          const revisions = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioRevision.findMany({
                where: { test_scenario_id: scenarioId },
                orderBy: { rev: "desc" },
              }),
            catch: (error) =>
              new Error(
                `リビジョン一覧の取得に失敗しました: ${String(error)}`,
              ),
          });

          return revisions.map(
            (r) =>
              new TestScenarioRevision({
                id: r.id,
                testScenarioId: r.test_scenario_id,
                rev: r.rev,
                status: r.status as RevisionStatus,
                title: r.title,
                description: r.description ?? undefined,
                testCases: (r.test_cases as Array<Record<string, unknown>>).map(
                  (tc) =>
                    new TestScenarioCaseRef({
                      caseId: tc.caseId as string,
                      revisionNumber: tc.revisionNumber as number,
                      order: tc.order as number,
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
              prisma.testScenarioRevision.findFirst({
                where: { test_scenario_id: input.scenarioId },
                orderBy: { rev: "desc" },
                select: { rev: true },
              }),
            catch: () => null,
          }).pipe(Effect.orElseSucceed(() => null));

          const nextRev = (latestRev?.rev ?? 0) + 1;

          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioRevision.create({
                data: {
                  test_scenario_id: input.scenarioId,
                  rev: nextRev,
                  status: "DRAFT",
                  title: input.title,
                  description: input.description ?? null,
                  test_cases: input.testCases,
                  created_by: input.createdBy,
                },
              }),
            catch: (error) =>
              new RevisionCreationError({
                message: `リビジョンの作成に失敗しました: ${String(error)}`,
                cause: error,
              }),
          });

          return new TestScenarioRevision({
            id: revision.id,
            testScenarioId: revision.test_scenario_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testCases: (revision.test_cases as Array<Record<string, unknown>>).map(
              (tc) =>
                new TestScenarioCaseRef({
                  caseId: tc.caseId as string,
                  revisionNumber: tc.revisionNumber as number,
                  order: tc.order as number,
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
              prisma.testScenarioRevision.update({
                where: { id: revisionId },
                data: {
                  title: input.title,
                  description:
                    input.description !== undefined
                      ? input.description
                      : undefined,
                  test_cases: input.testCases as never,
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

          return new TestScenarioRevision({
            id: revision.id,
            testScenarioId: revision.test_scenario_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testCases: (revision.test_cases as Array<Record<string, unknown>>).map(
              (tc) =>
                new TestScenarioCaseRef({
                  caseId: tc.caseId as string,
                  revisionNumber: tc.revisionNumber as number,
                  order: tc.order as number,
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
              prisma.testScenarioRevision.update({
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

          return new TestScenarioRevision({
            id: revision.id,
            testScenarioId: revision.test_scenario_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testCases: (revision.test_cases as Array<Record<string, unknown>>).map(
              (tc) =>
                new TestScenarioCaseRef({
                  caseId: tc.caseId as string,
                  revisionNumber: tc.revisionNumber as number,
                  order: tc.order as number,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: revision.approved_by ?? undefined,
            approvedAt: revision.approved_at ?? undefined,
          });
        }),

      delete: (scenarioId: string) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () =>
              prisma.testScenario.delete({ where: { id: scenarioId } }),
            catch: (error) =>
              new TestScenarioNotFoundError({
                message: `テストシナリオの削除に失敗しました: ${String(error)}`,
                scenarioId,
              }),
          });
        }),
    };
  }),
);
