import { Effect, Layer } from "effect";
import { Database } from "@shared/db/layers/prisma-layer";
import {
  ProjectRepository,
  ProjectNotFoundError,
  ProjectAlreadyExistsError,
} from "../../application/ports/project-repository";
import { Project } from "../../domain/models/project";

/**
 * Prisma Project Repository実装
 *
 * PrismaClientを使用してProjectRepositoryを実装
 */
export const PrismaProjectRepository = Layer.effect(
  ProjectRepository,
  Effect.gen(function* () {
    const prisma = yield* Database;

    return {
      findById: (id: string) =>
        Effect.gen(function* () {
          const project = yield* Effect.tryPromise({
            try: () => prisma.project.findUnique({ where: { id } }),
            catch: (error) =>
              new ProjectNotFoundError(
                `プロジェクトの取得に失敗しました: ${String(error)}`,
              ),
          });

          if (!project) {
            return yield* Effect.fail(
              new ProjectNotFoundError(`プロジェクトが見つかりません: ${id}`),
            );
          }

          return new Project({
            id: project.id,
            organizationId: project.organization_id,
            name: project.name,
            slug: project.slug,
            description: project.description ?? undefined,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
          });
        }),

      findBySlug: (organizationId: string, slug: string) =>
        Effect.gen(function* () {
          const project = yield* Effect.tryPromise({
            try: () =>
              prisma.project.findFirst({
                where: {
                  organization_id: organizationId,
                  slug,
                },
              }),
            catch: (error) =>
              new ProjectNotFoundError(
                `プロジェクトの取得に失敗しました: ${String(error)}`,
              ),
          });

          if (!project) {
            return yield* Effect.fail(
              new ProjectNotFoundError(`プロジェクトが見つかりません: ${slug}`),
            );
          }

          return new Project({
            id: project.id,
            organizationId: project.organization_id,
            name: project.name,
            slug: project.slug,
            description: project.description ?? undefined,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
          });
        }),

      findByOrganizationId: (organizationId: string) =>
        Effect.gen(function* () {
          const projects = yield* Effect.tryPromise({
            try: () =>
              prisma.project.findMany({
                where: { organization_id: organizationId },
                orderBy: { created_at: "desc" },
              }),
            catch: (error) =>
              new Error(
                `プロジェクト一覧の取得に失敗しました: ${String(error)}`,
              ),
          });

          return projects.map(
            (p) =>
              new Project({
                id: p.id,
                organizationId: p.organization_id,
                name: p.name,
                slug: p.slug,
                description: p.description ?? undefined,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
              }),
          );
        }),

      findActiveByOrganizationId: (organizationId: string) =>
        Effect.gen(function* () {
          const projects = yield* Effect.tryPromise({
            try: () =>
              prisma.project.findMany({
                where: {
                  organization_id: organizationId,
                },
                orderBy: { created_at: "desc" },
              }),
            catch: (error) =>
              new Error(
                `プロジェクト一覧の取得に失敗しました: ${String(error)}`,
              ),
          });

          return projects.map(
            (p) =>
              new Project({
                id: p.id,
                organizationId: p.organization_id,
                name: p.name,
                slug: p.slug,
                description: p.description ?? undefined,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
              }),
          );
        }),

      create: (input) =>
        Effect.gen(function* () {
          // スラッグの重複チェック（同一組織内）
          const existing = yield* Effect.tryPromise({
            try: () =>
              prisma.project.findFirst({
                where: {
                  organization_id: input.organizationId,
                  slug: input.slug,
                },
              }),
            catch: () => null,
          }).pipe(Effect.orElseSucceed(() => null));

          if (existing) {
            return yield* Effect.fail(
              new ProjectAlreadyExistsError(
                `スラッグ "${input.slug}" は既に使用されています`,
              ),
            );
          }

          const project = yield* Effect.tryPromise({
            try: () =>
              prisma.project.create({
                data: {
                  organization_id: input.organizationId,
                  name: input.name,
                  slug: input.slug,
                  description: input.description ?? null,
                },
              }),
            catch: (error) =>
              new ProjectAlreadyExistsError(
                `プロジェクトの作成に失敗しました: ${String(error)}`,
              ),
          });

          return new Project({
            id: project.id,
            organizationId: project.organization_id,
            name: project.name,
            slug: project.slug,
            description: project.description ?? undefined,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
          });
        }),

      update: (id, input) =>
        Effect.gen(function* () {
          const project = yield* Effect.tryPromise({
            try: () =>
              prisma.project.update({
                where: { id },
                data: {
                  name: input.name,
                  slug: input.slug,
                  description:
                    input.description !== undefined
                      ? input.description
                      : undefined,
                },
              }),
            catch: (error) =>
              new ProjectNotFoundError(
                `プロジェクトの更新に失敗しました: ${String(error)}`,
              ),
          });

          return new Project({
            id: project.id,
            organizationId: project.organization_id,
            name: project.name,
            slug: project.slug,
            description: project.description ?? undefined,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
          });
        }),

      delete: (id: string) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () => prisma.project.delete({ where: { id } }),
            catch: (error) =>
              new ProjectNotFoundError(
                `プロジェクトの削除に失敗しました: ${String(error)}`,
              ),
          });
        }),

      archive: (id: string) =>
        Effect.gen(function* () {
          // アーカイブフィールドがないため、プロジェクトを返すのみ
          const project = yield* Effect.tryPromise({
            try: () => prisma.project.findUnique({ where: { id } }),
            catch: (error) =>
              new ProjectNotFoundError(
                `プロジェクトの取得に失敗しました: ${String(error)}`,
              ),
          });

          if (!project) {
            return yield* Effect.fail(
              new ProjectNotFoundError(`プロジェクトが見つかりません: ${id}`),
            );
          }

          return new Project({
            id: project.id,
            organizationId: project.organization_id,
            name: project.name,
            slug: project.slug,
            description: project.description ?? undefined,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
          });
        }),

      unarchive: (id: string) =>
        Effect.gen(function* () {
          // アーカイブフィールドがないため、何もしない
          const project = yield* Effect.tryPromise({
            try: () => prisma.project.findUnique({ where: { id } }),
            catch: (error) =>
              new ProjectNotFoundError(
                `プロジェクトの取得に失敗しました: ${String(error)}`,
              ),
          });

          if (!project) {
            return yield* Effect.fail(
              new ProjectNotFoundError(`プロジェクトが見つかりません: ${id}`),
            );
          }

          return new Project({
            id: project.id,
            organizationId: project.organization_id,
            name: project.name,
            slug: project.slug,
            description: project.description ?? undefined,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
          });
        }),
    };
  }),
);
