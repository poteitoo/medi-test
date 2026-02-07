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
            updatedAt: scenario.created_at, // TestScenario doesn't have updated_at in schema
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
                updatedAt: s.created_at, // TestScenario doesn't have updated_at in schema
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
                      created_by: input.createdBy,
                      items: {
                        create: input.testCases.map((tc) => ({
                          case_revision_id: tc.caseId,
                          order: tc.order,
                          optional_flag: false,
                        })),
                      },
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
            updatedAt: scenario.created_at, // TestScenario doesn't have updated_at in schema
          });
        }),

      findRevisionById: (revisionId: string) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioRevision.findUnique({
                where: { id: revisionId },
                include: { items: true },
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
            testScenarioId: revision.scenario_stable_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testCases: revision.items.map(
              (item) =>
                new TestScenarioCaseRef({
                  caseId: item.case_revision_id,
                  revisionNumber: 1, // TODO: Extract from case_revision
                  order: item.order,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: undefined, // TODO: Fetch from Approval table
            approvedAt: undefined, // TODO: Fetch from Approval table
          });
        }),

      findLatestRevision: (scenarioId: string) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioRevision.findFirst({
                where: { scenario_stable_id: scenarioId },
                orderBy: { rev: "desc" },
                include: { items: true },
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
            testScenarioId: revision.scenario_stable_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testCases: revision.items.map(
              (item) =>
                new TestScenarioCaseRef({
                  caseId: item.case_revision_id,
                  revisionNumber: 1, // TODO: Extract from case_revision
                  order: item.order,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: undefined, // TODO: Fetch from Approval table
            approvedAt: undefined, // TODO: Fetch from Approval table
          });
        }),

      findAllRevisions: (scenarioId: string) =>
        Effect.gen(function* () {
          const revisions = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioRevision.findMany({
                where: { scenario_stable_id: scenarioId },
                orderBy: { rev: "desc" },
                include: { items: true },
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
                testScenarioId: r.scenario_stable_id,
                rev: r.rev,
                status: r.status as RevisionStatus,
                title: r.title,
                description: r.description ?? undefined,
                testCases: r.items.map(
                  (item) =>
                    new TestScenarioCaseRef({
                      caseId: item.case_revision_id,
                      revisionNumber: 1, // TODO: Extract from case_revision
                      order: item.order,
                    }),
                ),
                createdBy: r.created_by,
                createdAt: r.created_at,
                approvedBy: undefined, // TODO: Fetch from Approval table
                approvedAt: undefined, // TODO: Fetch from Approval table
              }),
          );
        }),

      createRevision: (input) =>
        Effect.gen(function* () {
          // 最新のリビジョン番号を取得
          const latestRev = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioRevision.findFirst({
                where: { scenario_stable_id: input.scenarioId },
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
                  scenario_stable_id: input.scenarioId,
                  rev: nextRev,
                  status: "DRAFT",
                  title: input.title,
                  description: input.description ?? null,
                  created_by: input.createdBy,
                  items: {
                    create: input.testCases.map((tc) => ({
                      case_revision_id: tc.caseId,
                      order: tc.order,
                      optional_flag: false,
                    })),
                  },
                },
                include: { items: true },
              }),
            catch: (error) =>
              new RevisionCreationError({
                message: `リビジョンの作成に失敗しました: ${String(error)}`,
                cause: error,
              }),
          });

          return new TestScenarioRevision({
            id: revision.id,
            testScenarioId: revision.scenario_stable_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testCases: revision.items.map(
              (item) =>
                new TestScenarioCaseRef({
                  caseId: item.case_revision_id,
                  revisionNumber: 1, // TODO: Extract from case_revision
                  order: item.order,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
          });
        }),

      updateRevision: (revisionId, input) =>
        Effect.gen(function* () {
          // If testCases are being updated, handle items separately
          if (input.testCases) {
            // Delete existing items and create new ones
            yield* Effect.tryPromise({
              try: () =>
                prisma.testScenarioItem.deleteMany({
                  where: { scenario_revision_id: revisionId },
                }),
              catch: (error) =>
                new RevisionUpdateError({
                  message: `既存アイテムの削除に失敗しました: ${String(error)}`,
                  revisionId,
                  cause: error,
                }),
            });
          }

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
                  status: input.status,
                  ...(input.testCases
                    ? {
                        items: {
                          create: input.testCases.map((tc) => ({
                            case_revision_id: tc.caseId,
                            order: tc.order,
                            optional_flag: false,
                          })),
                        },
                      }
                    : {}),
                },
                include: { items: true },
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
            testScenarioId: revision.scenario_stable_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testCases: revision.items.map(
              (item) =>
                new TestScenarioCaseRef({
                  caseId: item.case_revision_id,
                  revisionNumber: 1, // TODO: Extract from case_revision
                  order: item.order,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: undefined, // TODO: Fetch from Approval table
            approvedAt: undefined, // TODO: Fetch from Approval table
          });
        }),

      updateRevisionStatus: (revisionId, status, userId) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testScenarioRevision.update({
                where: { id: revisionId },
                data: {
                  status,
                },
                include: { items: true },
              }),
            catch: (error) =>
              new RevisionUpdateError({
                message: `ステータスの更新に失敗しました: ${String(error)}`,
                revisionId,
                cause: error,
              }),
          });

          // If status is APPROVED and userId provided, create approval record
          if (status === "APPROVED" && userId) {
            yield* Effect.tryPromise({
              try: () =>
                prisma.approval.create({
                  data: {
                    object_type: "SCENARIO_REVISION",
                    object_id: revisionId,
                    step: 1,
                    decision: "APPROVED",
                    approver_id: userId,
                  },
                }),
              catch: () => null, // Ignore approval creation errors
            }).pipe(Effect.orElseSucceed(() => null));
          }

          return new TestScenarioRevision({
            id: revision.id,
            testScenarioId: revision.scenario_stable_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            description: revision.description ?? undefined,
            testCases: revision.items.map(
              (item) =>
                new TestScenarioCaseRef({
                  caseId: item.case_revision_id,
                  revisionNumber: 1, // TODO: Extract from case_revision
                  order: item.order,
                }),
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: undefined, // TODO: Fetch from Approval table
            approvedAt: undefined, // TODO: Fetch from Approval table
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
