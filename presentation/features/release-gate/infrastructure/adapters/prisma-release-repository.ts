import { Effect, Layer } from "effect";
import { PrismaService } from "@shared/db/layers/prisma-layer";
import { ReleaseRepository } from "../../application/ports/release-repository";
import { Release } from "../../domain/models/release";
import { ReleaseBaseline } from "../../domain/models/release-baseline";
import type { ReleaseStatus } from "../../domain/models/release-status";
import { ReleaseNotFoundError } from "../../domain/errors/release-errors";

/**
 * Prisma ReleaseRepository実装
 */
export const PrismaReleaseRepository = Layer.effect(
  ReleaseRepository,
  Effect.gen(function* () {
    const prisma = yield* PrismaService;

    return {
      findById: (releaseId: string) =>
        Effect.gen(function* () {
          const release = yield* Effect.tryPromise({
            try: () =>
              prisma.release.findUnique({
                where: { id: releaseId },
              }),
            catch: (error) =>
              new ReleaseNotFoundError({
                message: `リリースの取得に失敗しました: ${String(error)}`,
                releaseId,
              }),
          });

          if (!release) {
            return yield* Effect.fail(
              new ReleaseNotFoundError({
                message: `リリースが見つかりません: ${releaseId}`,
                releaseId,
              }),
            );
          }

          return new Release({
            id: release.id,
            projectId: release.project_id,
            name: release.name,
            description: release.description ?? undefined,
            status: release.status as ReleaseStatus,
            buildRef: release.build_ref ?? undefined,
            createdAt: release.created_at,
            updatedAt: release.updated_at,
          });
        }),

      findByProjectId: (projectId: string) =>
        Effect.gen(function* () {
          const releases = yield* Effect.tryPromise({
            try: () =>
              prisma.release.findMany({
                where: { project_id: projectId },
                orderBy: { created_at: "desc" },
              }),
            catch: (error) =>
              new Error(
                `リリース一覧の取得に失敗しました: ${String(error)}`,
              ),
          });

          return releases.map(
            (r) =>
              new Release({
                id: r.id,
                projectId: r.project_id,
                name: r.name,
                description: r.description ?? undefined,
                status: r.status as ReleaseStatus,
                buildRef: r.build_ref ?? undefined,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
              }),
          );
        }),

      create: (input) =>
        Effect.gen(function* () {
          const release = yield* Effect.tryPromise({
            try: () =>
              prisma.release.create({
                data: {
                  project_id: input.projectId,
                  name: input.name,
                  description: input.description,
                  build_ref: input.buildRef,
                  status: "PLANNING",
                },
              }),
            catch: (error) =>
              new Error(`リリースの作成に失敗しました: ${String(error)}`),
          });

          return new Release({
            id: release.id,
            projectId: release.project_id,
            name: release.name,
            description: release.description ?? undefined,
            status: release.status as ReleaseStatus,
            buildRef: release.build_ref ?? undefined,
            createdAt: release.created_at,
            updatedAt: release.updated_at,
          });
        }),

      updateStatus: (releaseId: string, status: ReleaseStatus) =>
        Effect.gen(function* () {
          const release = yield* Effect.tryPromise({
            try: () =>
              prisma.release.update({
                where: { id: releaseId },
                data: { status },
              }),
            catch: (error) =>
              new ReleaseNotFoundError({
                message: `リリースステータスの更新に失敗しました: ${String(error)}`,
                releaseId,
              }),
          });

          return new Release({
            id: release.id,
            projectId: release.project_id,
            name: release.name,
            description: release.description ?? undefined,
            status: release.status as ReleaseStatus,
            buildRef: release.build_ref ?? undefined,
            createdAt: release.created_at,
            updatedAt: release.updated_at,
          });
        }),

      createBaseline: (input) =>
        Effect.gen(function* () {
          const baseline = yield* Effect.tryPromise({
            try: () =>
              prisma.releaseBaseline.create({
                data: {
                  release_id: input.releaseId,
                  source_list_revision_id: input.sourceListRevisionId,
                  created_by: input.createdBy,
                },
              }),
            catch: (error) =>
              new Error(
                `リリースベースラインの作成に失敗しました: ${String(error)}`,
              ),
          });

          return new ReleaseBaseline({
            id: baseline.id,
            releaseId: baseline.release_id,
            sourceListRevisionId: baseline.source_list_revision_id,
            createdBy: baseline.created_by,
            createdAt: baseline.created_at,
          });
        }),

      findBaselines: (releaseId: string) =>
        Effect.gen(function* () {
          const baselines = yield* Effect.tryPromise({
            try: () =>
              prisma.releaseBaseline.findMany({
                where: { release_id: releaseId },
                orderBy: { created_at: "desc" },
              }),
            catch: (error) =>
              new Error(
                `ベースライン一覧の取得に失敗しました: ${String(error)}`,
              ),
          });

          return baselines.map(
            (b) =>
              new ReleaseBaseline({
                id: b.id,
                releaseId: b.release_id,
                sourceListRevisionId: b.source_list_revision_id,
                createdBy: b.created_by,
                createdAt: b.created_at,
              }),
          );
        }),

      delete: (releaseId: string) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () =>
              prisma.release.delete({
                where: { id: releaseId },
              }),
            catch: (error) =>
              new ReleaseNotFoundError({
                message: `リリースの削除に失敗しました: ${String(error)}`,
                releaseId,
              }),
          });
        }),
    };
  }),
);
