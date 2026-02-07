import { Effect, Layer } from "effect";
import { PrismaService } from "~/../../shared/db/layers/prisma-layer";
import { TestCaseRepository } from "../../application/ports/test-case-repository";
import { TestCase } from "../../domain/models/test-case";
import { TestCaseRevision } from "../../domain/models/test-case-revision";
import { TestCaseContent } from "../../domain/models/test-case-content";
import type { RevisionStatus } from "../../domain/models/revision-status";
import {
  TestCaseNotFoundError,
  TestCaseRevisionNotFoundError,
  TestCaseCreationError,
  TestCaseUpdateError,
} from "../../domain/errors/test-case-errors";
import {
  RevisionCreationError,
  RevisionUpdateError,
} from "../../domain/errors/revision-errors";

/**
 * Prisma TestCaseRepository実装
 */
export const PrismaTestCaseRepository = Layer.effect(
  TestCaseRepository,
  Effect.gen(function* () {
    const prisma = yield* PrismaService;

    return {
      findById: (caseId: string) =>
        Effect.gen(function* () {
          const testCase = yield* Effect.tryPromise({
            try: () => prisma.testCase.findUnique({ where: { id: caseId } }),
            catch: (error) =>
              new TestCaseNotFoundError({
                message: `テストケースの取得に失敗しました: ${String(error)}`,
                caseId,
              }),
          });

          if (!testCase) {
            return yield* Effect.fail(
              new TestCaseNotFoundError({
                message: `テストケースが見つかりません: ${caseId}`,
                caseId,
              }),
            );
          }

          return new TestCase({
            id: testCase.id,
            projectId: testCase.project_id,
            createdAt: testCase.created_at,
            updatedAt: testCase.updated_at,
          });
        }),

      findByProjectId: (projectId: string) =>
        Effect.gen(function* () {
          const testCases = yield* Effect.tryPromise({
            try: () =>
              prisma.testCase.findMany({
                where: { project_id: projectId },
                orderBy: { created_at: "desc" },
              }),
            catch: (error) =>
              new Error(
                `テストケース一覧の取得に失敗しました: ${String(error)}`,
              ),
          });

          return testCases.map(
            (tc) =>
              new TestCase({
                id: tc.id,
                projectId: tc.project_id,
                createdAt: tc.created_at,
                updatedAt: tc.updated_at,
              }),
          );
        }),

      create: (input) =>
        Effect.gen(function* () {
          const testCase = yield* Effect.tryPromise({
            try: () =>
              prisma.testCase.create({
                data: {
                  project_id: input.projectId,
                  revisions: {
                    create: {
                      rev: 1,
                      status: "DRAFT",
                      title: input.title,
                      content: input.content,
                      created_by: input.createdBy,
                    },
                  },
                },
              }),
            catch: (error) =>
              new TestCaseCreationError({
                message: `テストケースの作成に失敗しました: ${String(error)}`,
                cause: error,
              }),
          });

          return new TestCase({
            id: testCase.id,
            projectId: testCase.project_id,
            createdAt: testCase.created_at,
            updatedAt: testCase.updated_at,
          });
        }),

      findRevisionById: (revisionId: string) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testCaseRevision.findUnique({
                where: { id: revisionId },
              }),
            catch: (error) =>
              new TestCaseRevisionNotFoundError({
                message: `リビジョンの取得に失敗しました: ${String(error)}`,
                revisionId,
              }),
          });

          if (!revision) {
            return yield* Effect.fail(
              new TestCaseRevisionNotFoundError({
                message: `リビジョンが見つかりません: ${revisionId}`,
                revisionId,
              }),
            );
          }

          return new TestCaseRevision({
            id: revision.id,
            testCaseId: revision.test_case_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            content: new TestCaseContent(
              revision.content as Record<string, unknown>,
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: revision.approved_by ?? undefined,
            approvedAt: revision.approved_at ?? undefined,
          });
        }),

      findLatestRevision: (caseId: string) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testCaseRevision.findFirst({
                where: { test_case_id: caseId },
                orderBy: { rev: "desc" },
              }),
            catch: (error) =>
              new TestCaseRevisionNotFoundError({
                message: `最新リビジョンの取得に失敗しました: ${String(error)}`,
              }),
          });

          if (!revision) {
            return yield* Effect.fail(
              new TestCaseRevisionNotFoundError({
                message: `リビジョンが見つかりません (テストケースID: ${caseId})`,
              }),
            );
          }

          return new TestCaseRevision({
            id: revision.id,
            testCaseId: revision.test_case_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            content: new TestCaseContent(
              revision.content as Record<string, unknown>,
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: revision.approved_by ?? undefined,
            approvedAt: revision.approved_at ?? undefined,
          });
        }),

      findAllRevisions: (caseId: string) =>
        Effect.gen(function* () {
          const revisions = yield* Effect.tryPromise({
            try: () =>
              prisma.testCaseRevision.findMany({
                where: { test_case_id: caseId },
                orderBy: { rev: "desc" },
              }),
            catch: (error) =>
              new Error(
                `リビジョン一覧の取得に失敗しました: ${String(error)}`,
              ),
          });

          return revisions.map(
            (r) =>
              new TestCaseRevision({
                id: r.id,
                testCaseId: r.test_case_id,
                rev: r.rev,
                status: r.status as RevisionStatus,
                title: r.title,
                content: new TestCaseContent(r.content as Record<string, unknown>),
                createdBy: r.created_by,
                createdAt: r.created_at,
                approvedBy: r.approved_by ?? undefined,
                approvedAt: r.approved_at ?? undefined,
              }),
          );
        }),

      findRevisionByNumber: (caseId: string, revisionNumber: number) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testCaseRevision.findFirst({
                where: {
                  test_case_id: caseId,
                  rev: revisionNumber,
                },
              }),
            catch: (error) =>
              new TestCaseRevisionNotFoundError({
                message: `リビジョンの取得に失敗しました: ${String(error)}`,
              }),
          });

          if (!revision) {
            return yield* Effect.fail(
              new TestCaseRevisionNotFoundError({
                message: `リビジョンが見つかりません (rev: ${revisionNumber})`,
              }),
            );
          }

          return new TestCaseRevision({
            id: revision.id,
            testCaseId: revision.test_case_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            content: new TestCaseContent(
              revision.content as Record<string, unknown>,
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: revision.approved_by ?? undefined,
            approvedAt: revision.approved_at ?? undefined,
          });
        }),

      createRevision: (input) =>
        Effect.gen(function* () {
          // 最新のリビジョン番号を取得
          const latestRev = yield* Effect.tryPromise({
            try: () =>
              prisma.testCaseRevision.findFirst({
                where: { test_case_id: input.caseId },
                orderBy: { rev: "desc" },
                select: { rev: true },
              }),
            catch: () => null,
          }).pipe(Effect.orElseSucceed(() => null));

          const nextRev = (latestRev?.rev ?? 0) + 1;

          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testCaseRevision.create({
                data: {
                  test_case_id: input.caseId,
                  rev: nextRev,
                  status: "DRAFT",
                  title: input.title,
                  content: input.content,
                  created_by: input.createdBy,
                },
              }),
            catch: (error) =>
              new RevisionCreationError({
                message: `リビジョンの作成に失敗しました: ${String(error)}`,
                cause: error,
              }),
          });

          return new TestCaseRevision({
            id: revision.id,
            testCaseId: revision.test_case_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            content: new TestCaseContent(
              revision.content as Record<string, unknown>,
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
          });
        }),

      updateRevision: (revisionId, input) =>
        Effect.gen(function* () {
          const revision = yield* Effect.tryPromise({
            try: () =>
              prisma.testCaseRevision.update({
                where: { id: revisionId },
                data: {
                  title: input.title,
                  content: input.content as never,
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

          return new TestCaseRevision({
            id: revision.id,
            testCaseId: revision.test_case_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            content: new TestCaseContent(
              revision.content as Record<string, unknown>,
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
              prisma.testCaseRevision.update({
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

          return new TestCaseRevision({
            id: revision.id,
            testCaseId: revision.test_case_id,
            rev: revision.rev,
            status: revision.status as RevisionStatus,
            title: revision.title,
            content: new TestCaseContent(
              revision.content as Record<string, unknown>,
            ),
            createdBy: revision.created_by,
            createdAt: revision.created_at,
            approvedBy: revision.approved_by ?? undefined,
            approvedAt: revision.approved_at ?? undefined,
          });
        }),

      delete: (caseId: string) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () => prisma.testCase.delete({ where: { id: caseId } }),
            catch: (error) =>
              new TestCaseUpdateError({
                message: `テストケースの削除に失敗しました: ${String(error)}`,
                caseId,
                cause: error,
              }),
          });
        }),

      findRevisionsByStatus: (projectId: string, status: RevisionStatus) =>
        Effect.gen(function* () {
          const revisions = yield* Effect.tryPromise({
            try: () =>
              prisma.testCaseRevision.findMany({
                where: {
                  test_case: {
                    project_id: projectId,
                  },
                  status,
                },
                orderBy: { created_at: "desc" },
              }),
            catch: (error) =>
              new Error(
                `リビジョンの検索に失敗しました: ${String(error)}`,
              ),
          });

          return revisions.map(
            (r) =>
              new TestCaseRevision({
                id: r.id,
                testCaseId: r.test_case_id,
                rev: r.rev,
                status: r.status as RevisionStatus,
                title: r.title,
                content: new TestCaseContent(r.content as Record<string, unknown>),
                createdBy: r.created_by,
                createdAt: r.created_at,
                approvedBy: r.approved_by ?? undefined,
                approvedAt: r.approved_at ?? undefined,
              }),
          );
        }),
    };
  }),
);
