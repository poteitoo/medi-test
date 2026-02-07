import { Effect, Layer } from "effect";
import { PrismaClient } from "@prisma/client";
import {
  RBACService,
  ForbiddenError,
  RoleNotFoundError,
} from "../application/ports/rbac-service";
import {
  RoleAssignment,
  type RoleType,
  hasRole,
  hasAnyRole,
} from "../domain/models/role-assignment";

/**
 * Prisma RBAC Adapter実装
 *
 * PrismaClientを使用してRBACServiceを実装
 */
export const PrismaRBACAdapter = Layer.effect(
  RBACService,
  Effect.gen(function* () {
    const prisma = new PrismaClient();

    return {
      getUserRoles: (userId: string) =>
        Effect.gen(function* () {
          const assignments = yield* Effect.tryPromise({
            try: () =>
              prisma.roleAssignment.findMany({
                where: { user_id: userId },
              }),
            catch: (error) =>
              new RoleNotFoundError(
                `ロール取得に失敗しました: ${String(error)}`,
              ),
          });

          if (assignments.length === 0) {
            return yield* Effect.fail(
              new RoleNotFoundError(
                `ユーザー ${userId} のロール割り当てが見つかりません`,
              ),
            );
          }

          return assignments.map(
            (a) =>
              new RoleAssignment({
                id: a.id,
                userId: a.user_id,
                organizationId: a.organization_id ?? undefined,
                projectId: a.project_id ?? undefined,
                role: a.role as RoleType,
                createdAt: a.created_at,
              }),
          );
        }),

      hasRole: (userId: string, role: RoleType, scope) =>
        Effect.gen(function* () {
          const assignments = yield* Effect.tryPromise({
            try: () =>
              prisma.roleAssignment.findMany({
                where: { user_id: userId },
              }),
            catch: () => [] as const,
          }).pipe(Effect.orElseSucceed(() => [] as const));

          const domainAssignments = assignments.map(
            (a) =>
              new RoleAssignment({
                id: a.id,
                userId: a.user_id,
                organizationId: a.organization_id ?? undefined,
                projectId: a.project_id ?? undefined,
                role: a.role as RoleType,
                createdAt: a.created_at,
              }),
          );

          return hasRole(domainAssignments, role, scope);
        }),

      requireRole: (userId: string, role: RoleType, scope) =>
        Effect.gen(function* () {
          const hasRequiredRole = yield* Effect.gen(function* () {
            const assignments = yield* Effect.tryPromise({
              try: () =>
                prisma.roleAssignment.findMany({
                  where: { user_id: userId },
                }),
              catch: () => [] as const,
            }).pipe(Effect.orElseSucceed(() => [] as const));

            const domainAssignments = assignments.map(
              (a) =>
                new RoleAssignment({
                  id: a.id,
                  userId: a.user_id,
                  organizationId: a.organization_id ?? undefined,
                  projectId: a.project_id ?? undefined,
                  role: a.role as RoleType,
                  createdAt: a.created_at,
                }),
            );

            return hasRole(domainAssignments, role, scope);
          });

          if (!hasRequiredRole) {
            return yield* Effect.fail(
              new ForbiddenError(
                `ロール ${role} が必要です${scope?.organizationId ? ` (組織: ${scope.organizationId})` : ""}${scope?.projectId ? ` (プロジェクト: ${scope.projectId})` : ""}`,
              ),
            );
          }
        }),

      hasAnyRole: (userId: string, roles: readonly RoleType[], scope) =>
        Effect.gen(function* () {
          const assignments = yield* Effect.tryPromise({
            try: () =>
              prisma.roleAssignment.findMany({
                where: { user_id: userId },
              }),
            catch: () => [] as const,
          }).pipe(Effect.orElseSucceed(() => [] as const));

          const domainAssignments = assignments.map(
            (a) =>
              new RoleAssignment({
                id: a.id,
                userId: a.user_id,
                organizationId: a.organization_id ?? undefined,
                projectId: a.project_id ?? undefined,
                role: a.role as RoleType,
                createdAt: a.created_at,
              }),
          );

          return hasAnyRole(domainAssignments, roles, scope);
        }),

      requireAnyRole: (userId: string, roles: readonly RoleType[], scope) =>
        Effect.gen(function* () {
          const hasRequiredRole = yield* Effect.gen(function* () {
            const assignments = yield* Effect.tryPromise({
              try: () =>
                prisma.roleAssignment.findMany({
                  where: { user_id: userId },
                }),
              catch: () => [] as const,
            }).pipe(Effect.orElseSucceed(() => [] as const));

            const domainAssignments = assignments.map(
              (a) =>
                new RoleAssignment({
                  id: a.id,
                  userId: a.user_id,
                  organizationId: a.organization_id ?? undefined,
                  projectId: a.project_id ?? undefined,
                  role: a.role as RoleType,
                  createdAt: a.created_at,
                }),
            );

            return hasAnyRole(domainAssignments, roles, scope);
          });

          if (!hasRequiredRole) {
            return yield* Effect.fail(
              new ForbiddenError(
                `次のいずれかのロールが必要です: ${roles.join(", ")}${scope?.organizationId ? ` (組織: ${scope.organizationId})` : ""}${scope?.projectId ? ` (プロジェクト: ${scope.projectId})` : ""}`,
              ),
            );
          }
        }),

      assignRole: (input) =>
        Effect.gen(function* () {
          const assignment = yield* Effect.tryPromise({
            try: () =>
              prisma.roleAssignment.create({
                data: {
                  user_id: input.userId,
                  organization_id: input.organizationId ?? "",
                  project_id: input.projectId ?? undefined,
                  role: input.role,
                },
              }),
            catch: (error) =>
              new Error(`ロール割り当てに失敗しました: ${String(error)}`),
          });

          return new RoleAssignment({
            id: assignment.id,
            userId: assignment.user_id,
            organizationId: assignment.organization_id ?? undefined,
            projectId: assignment.project_id ?? undefined,
            role: assignment.role as RoleType,
            createdAt: assignment.created_at,
          });
        }),

      revokeRole: (roleAssignmentId: string) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () =>
              prisma.roleAssignment.delete({
                where: { id: roleAssignmentId },
              }),
            catch: (error) =>
              new Error(`ロール削除に失敗しました: ${String(error)}`),
          });
        }),
    };
  }),
);
