import { Effect, Layer } from "effect";
import { Database } from "@shared/db/layers/prisma-layer";
import {
  OrganizationRepository,
  OrganizationNotFoundError,
  OrganizationAlreadyExistsError,
} from "../../application/ports/organization-repository";
import { Organization } from "../../domain/models/organization";

/**
 * Prisma Organization Repository実装
 *
 * PrismaClientを使用してOrganizationRepositoryを実装
 */
export const PrismaOrganizationRepository = Layer.effect(
  OrganizationRepository,
  Effect.gen(function* () {
    const prisma = yield* Database;

    return {
      findById: (id: string) =>
        Effect.gen(function* () {
          const org = yield* Effect.tryPromise({
            try: () => prisma.organization.findUnique({ where: { id } }),
            catch: (error) =>
              new OrganizationNotFoundError(
                `組織の取得に失敗しました: ${String(error)}`,
              ),
          });

          if (!org) {
            return yield* Effect.fail(
              new OrganizationNotFoundError(`組織が見つかりません: ${id}`),
            );
          }

          return new Organization({
            id: org.id,
            name: org.name,
            slug: org.slug,
            createdAt: org.created_at,
            updatedAt: org.updated_at,
          });
        }),

      findBySlug: (slug: string) =>
        Effect.gen(function* () {
          const org = yield* Effect.tryPromise({
            try: () => prisma.organization.findUnique({ where: { slug } }),
            catch: (error) =>
              new OrganizationNotFoundError(
                `組織の取得に失敗しました: ${String(error)}`,
              ),
          });

          if (!org) {
            return yield* Effect.fail(
              new OrganizationNotFoundError(`組織が見つかりません: ${slug}`),
            );
          }

          return new Organization({
            id: org.id,
            name: org.name,
            slug: org.slug,
            createdAt: org.created_at,
            updatedAt: org.updated_at,
          });
        }),

      findAll: () =>
        Effect.gen(function* () {
          const orgs = yield* Effect.tryPromise({
            try: () => prisma.organization.findMany(),
            catch: (error) =>
              new Error(`組織一覧の取得に失敗しました: ${String(error)}`),
          });

          return orgs.map(
            (org) =>
              new Organization({
                id: org.id,
                name: org.name,
                slug: org.slug,
                createdAt: org.created_at,
                updatedAt: org.updated_at,
              }),
          );
        }),

      create: (input) =>
        Effect.gen(function* () {
          // スラッグの重複チェック
          const existing = yield* Effect.tryPromise({
            try: () =>
              prisma.organization.findUnique({
                where: { slug: input.slug },
              }),
            catch: () => null,
          }).pipe(Effect.orElseSucceed(() => null));

          if (existing) {
            return yield* Effect.fail(
              new OrganizationAlreadyExistsError(
                `スラッグ "${input.slug}" は既に使用されています`,
              ),
            );
          }

          const org = yield* Effect.tryPromise({
            try: () =>
              prisma.organization.create({
                data: {
                  name: input.name,
                  slug: input.slug,
                },
              }),
            catch: (error) =>
              new OrganizationAlreadyExistsError(
                `組織の作成に失敗しました: ${String(error)}`,
              ),
          });

          return new Organization({
            id: org.id,
            name: org.name,
            slug: org.slug,
            createdAt: org.created_at,
            updatedAt: org.updated_at,
          });
        }),

      update: (id, input) =>
        Effect.gen(function* () {
          const org = yield* Effect.tryPromise({
            try: () =>
              prisma.organization.update({
                where: { id },
                data: {
                  name: input.name,
                  slug: input.slug,
                },
              }),
            catch: (error) =>
              new OrganizationNotFoundError(
                `組織の更新に失敗しました: ${String(error)}`,
              ),
          });

          return new Organization({
            id: org.id,
            name: org.name,
            slug: org.slug,
            createdAt: org.created_at,
            updatedAt: org.updated_at,
          });
        }),

      delete: (id: string) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () => prisma.organization.delete({ where: { id } }),
            catch: (error) =>
              new OrganizationNotFoundError(
                `組織の削除に失敗しました: ${String(error)}`,
              ),
          });
        }),
    };
  }),
);
