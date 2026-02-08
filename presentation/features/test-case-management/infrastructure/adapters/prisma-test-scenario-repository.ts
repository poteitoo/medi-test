import { Effect, Layer } from "effect";
import { Database, PrismaLayer } from "@shared/db/layers/prisma-layer";
import { TestScenarioRepository } from "../../application/ports/test-scenario-repository";
import type { PaginationOptions } from "../../application/ports/test-scenario-repository";
import { TestScenario } from "../../domain/models/test-scenario";
import {
  TestScenarioRevision,
  TestScenarioItem,
} from "../../domain/models/test-scenario-revision";
import type { RevisionStatus } from "../../domain/models/revision-status";
import { canTransitionTo } from "../../domain/models/revision-status";
import { TestScenarioNotFoundError } from "../../domain/errors/test-case-errors";
import {
  RevisionCreationError,
  RevisionUpdateError,
  RevisionImmutableError,
} from "../../domain/errors/revision-errors";
import { InvalidStatusTransitionError } from "../../domain/errors/status-errors";

/**
 * Prisma TestScenarioRepository実装
 */
const PrismaTestScenarioRepositoryImpl = Effect.gen(function* () {
  const prisma = yield* Database;

  return TestScenarioRepository.of({
    create: (projectId: string, createdBy: string) =>
      Effect.gen(function* () {
        const scenario = yield* Effect.tryPromise({
          try: () =>
            prisma.testScenario.create({
              data: {
                project_id: projectId,
                revisions: {
                  create: {
                    rev: 1,
                    status: "DRAFT",
                    title: "新規テストシナリオ",
                    created_by: createdBy,
                  },
                },
              },
            }),
          catch: (error) =>
            new Error(`テストシナリオの作成に失敗しました: ${String(error)}`),
        });

        return new TestScenario({
          id: scenario.id,
          projectId: scenario.project_id,
          createdAt: scenario.created_at,
        });
      }),

    findById: (scenarioId: string) =>
      Effect.gen(function* () {
        const scenario = yield* Effect.promise(() =>
          prisma.testScenario.findUnique({ where: { id: scenarioId } }),
        );

        if (!scenario) {
          return null;
        }

        return new TestScenario({
          id: scenario.id,
          projectId: scenario.project_id,
          createdAt: scenario.created_at,
        });
      }),

    findByProjectId: (projectId: string, options?: PaginationOptions) =>
      Effect.gen(function* () {
        const scenarios = yield* Effect.promise(() =>
          prisma.testScenario.findMany({
            where: { project_id: projectId },
            orderBy: { created_at: "desc" },
            skip: options?.offset ?? 0,
            take: options?.limit,
          }),
        );

        return scenarios.map(
          (s) =>
            new TestScenario({
              id: s.id,
              projectId: s.project_id,
              createdAt: s.created_at,
            }),
        );
      }),

    createRevision: (
      scenarioId: string,
      data: {
        readonly title: string;
        readonly description?: string;
        readonly items: readonly TestScenarioItem[];
        readonly reason: string;
        readonly createdBy: string;
      },
    ) =>
      Effect.gen(function* () {
        // 最新のリビジョン番号を取得
        const latestRev = yield* Effect.promise(() =>
          prisma.testScenarioRevision.findFirst({
            where: { scenario_stable_id: scenarioId },
            orderBy: { rev: "desc" },
            select: { rev: true },
          }),
        );

        const nextRev = (latestRev?.rev ?? 0) + 1;

        const revision = yield* Effect.tryPromise({
          try: () =>
            prisma.testScenarioRevision.create({
              data: {
                scenario_stable_id: scenarioId,
                rev: nextRev,
                status: "DRAFT",
                title: data.title,
                description: data.description ?? null,
                reason: data.reason,
                created_by: data.createdBy,
                items: {
                  create: data.items.map((item) => ({
                    case_revision_id: item.caseRevisionId,
                    order: item.order,
                    optional_flag: item.optionalFlag,
                    note: item.note ?? null,
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
          scenarioStableId: revision.scenario_stable_id,
          rev: revision.rev,
          status: revision.status as RevisionStatus,
          title: revision.title,
          description: revision.description ?? undefined,
          items: revision.items.map(
            (item) =>
              new TestScenarioItem({
                caseRevisionId: item.case_revision_id,
                order: item.order,
                optionalFlag: item.optional_flag,
                note: item.note ?? undefined,
              }),
          ),
          reason: data.reason,
          createdBy: revision.created_by,
          createdAt: revision.created_at,
        });
      }),

    findRevisionById: (revisionId: string) =>
      Effect.gen(function* () {
        const revision = yield* Effect.promise(() =>
          prisma.testScenarioRevision.findUnique({
            where: { id: revisionId },
            include: { items: true },
          }),
        );

        if (!revision) {
          return null;
        }

        return new TestScenarioRevision({
          id: revision.id,
          scenarioStableId: revision.scenario_stable_id,
          rev: revision.rev,
          status: revision.status as RevisionStatus,
          title: revision.title,
          description: revision.description ?? undefined,
          items: revision.items.map(
            (item) =>
              new TestScenarioItem({
                caseRevisionId: item.case_revision_id,
                order: item.order,
                optionalFlag: item.optional_flag,
                note: item.note ?? undefined,
              }),
          ),
          createdBy: revision.created_by,
          createdAt: revision.created_at,
        });
      }),

    findLatestRevision: (scenarioId: string) =>
      Effect.gen(function* () {
        const revision = yield* Effect.promise(() =>
          prisma.testScenarioRevision.findFirst({
            where: { scenario_stable_id: scenarioId },
            orderBy: { rev: "desc" },
            include: { items: true },
          }),
        );

        if (!revision) {
          return null;
        }

        return new TestScenarioRevision({
          id: revision.id,
          scenarioStableId: revision.scenario_stable_id,
          rev: revision.rev,
          status: revision.status as RevisionStatus,
          title: revision.title,
          description: revision.description ?? undefined,
          items: revision.items.map(
            (item) =>
              new TestScenarioItem({
                caseRevisionId: item.case_revision_id,
                order: item.order,
                optionalFlag: item.optional_flag,
                note: item.note ?? undefined,
              }),
          ),
          createdBy: revision.created_by,
          createdAt: revision.created_at,
        });
      }),

    findRevisionHistory: (scenarioId: string, options?: PaginationOptions) =>
      Effect.gen(function* () {
        const revisions = yield* Effect.promise(() =>
          prisma.testScenarioRevision.findMany({
            where: { scenario_stable_id: scenarioId },
            orderBy: { rev: "desc" },
            skip: options?.offset ?? 0,
            take: options?.limit,
            include: { items: true },
          }),
        );

        return revisions.map(
          (r) =>
            new TestScenarioRevision({
              id: r.id,
              scenarioStableId: r.scenario_stable_id,
              rev: r.rev,
              status: r.status as RevisionStatus,
              title: r.title,
              description: r.description ?? undefined,
              items: r.items.map(
                (item) =>
                  new TestScenarioItem({
                    caseRevisionId: item.case_revision_id,
                    order: item.order,
                    optionalFlag: item.optional_flag,
                    note: item.note ?? undefined,
                  }),
              ),
              createdBy: r.created_by,
              createdAt: r.created_at,
            }),
        );
      }),

    updateRevisionStatus: (revisionId: string, status: RevisionStatus) =>
      Effect.gen(function* () {
        // 現在のリビジョンを取得
        const currentRevision = yield* Effect.tryPromise({
          try: () =>
            prisma.testScenarioRevision.findUnique({
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
            prisma.testScenarioRevision.update({
              where: { id: revisionId },
              data: { status },
              include: { items: true },
            }),
          catch: (error) =>
            new RevisionImmutableError({
              revisionId,
              status: currentStatus,
              message: "リビジョンのステータス更新に失敗しました",
            }),
        });

        return new TestScenarioRevision({
          id: updated.id,
          scenarioStableId: updated.scenario_stable_id,
          rev: updated.rev,
          status: updated.status as RevisionStatus,
          title: updated.title,
          description: updated.description ?? undefined,
          items: updated.items.map(
            (item) =>
              new TestScenarioItem({
                caseRevisionId: item.case_revision_id,
                order: item.order,
                optionalFlag: item.optional_flag,
                note: item.note ?? undefined,
              }),
          ),
          createdBy: updated.created_by,
          createdAt: updated.created_at,
        });
      }),

    deleteScenario: (scenarioId: string) =>
      Effect.gen(function* () {
        yield* Effect.tryPromise({
          try: () => prisma.testScenario.delete({ where: { id: scenarioId } }),
          catch: (error) =>
            new TestScenarioNotFoundError({
              message: `テストシナリオの削除に失敗しました: ${String(error)}`,
              scenarioId,
            }),
        });

        return undefined;
      }),
  });
});

/**
 * Prisma TestScenarioRepository Layer (Live)
 */
export const PrismaTestScenarioRepositoryLive = Layer.effect(
  TestScenarioRepository,
  PrismaTestScenarioRepositoryImpl,
).pipe(Layer.provide(PrismaLayer));
