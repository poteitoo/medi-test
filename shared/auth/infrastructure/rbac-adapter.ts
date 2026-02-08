import { Effect, Layer } from "effect";
import {
  RBACService,
  PermissionDeniedError,
  RolePermissions,
  type Permission,
} from "@shared/auth/application/ports/rbac-service";
import {
  RoleAssignment,
  type RoleType,
  type CreateRoleAssignmentInput,
} from "@shared/auth/domain/models/role-assignment";
import { AuthService } from "@shared/auth/application/ports/auth-service";
import { prisma } from "@shared/db/client";

/**
 * RBAC Adapter
 *
 * Prisma を使用した RBACService の実装
 *
 * @remarks
 * **アーキテクチャ:**
 * - Prisma DB の role_assignment テーブルからロール情報を取得
 * - RolePermissions マッピングを使用して権限チェック
 * - AuthService と統合して現在のユーザーのロールを取得
 * - Organization レベルと Project レベルの階層的な権限管理をサポート
 *
 * **権限チェックロジック:**
 * 1. ユーザーのロール割り当てを DB から取得
 * 2. スコープ (organizationId, projectId) でフィルタリング
 * 3. ロールに紐づく権限を RolePermissions から取得
 * 4. 要求された権限を持っているかチェック
 *
 * **スコープ階層:**
 * - Project レベルのロールは、その Project 内でのみ有効
 * - Organization レベルのロールは、その Organization 内のすべての Project で有効
 * - スコープが指定されない場合は、すべてのロールを考慮
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const rbac = yield* RBACService;
 *   const auth = yield* AuthService;
 *
 *   // 現在のユーザーの権限をチェック
 *   const user = yield* auth.getCurrentUser();
 *   yield* rbac.requirePermission(Permission.TEST_CASE_CREATE);
 *
 *   // 特定のユーザーのロールを取得
 *   const roles = yield* rbac.getUserRoles(user.id);
 *   console.log(`ロール: ${roles.map(r => r.role).join(", ")}`);
 * });
 *
 * await Effect.runPromise(
 *   program.pipe(Effect.provide(Layer.merge(RBACLive, ClerkAuthLive)))
 * );
 * ```
 */

/**
 * Prisma RoleAssignment を Domain RoleAssignment にマッピング
 *
 * @param dbAssignment - Prisma の RoleAssignment
 * @returns Domain RoleAssignment インスタンス
 */
function mapPrismaRoleAssignmentToDomain(dbAssignment: {
  id: string;
  user_id: string;
  organization_id: string | null;
  project_id: string | null;
  role: string;
  created_at: Date;
}): RoleAssignment {
  return new RoleAssignment({
    id: dbAssignment.id,
    userId: dbAssignment.user_id,
    organizationId: dbAssignment.organization_id ?? undefined,
    projectId: dbAssignment.project_id ?? undefined,
    role: dbAssignment.role as RoleType,
    createdAt: dbAssignment.created_at,
  });
}

/**
 * スコープに基づいてロール割り当てをフィルタリング
 *
 * @param assignments - ロール割り当てリスト
 * @param scope - スコープ (organizationId, projectId)
 * @returns フィルタリングされたロール割り当て
 *
 * @remarks
 * **フィルタリングロジック:**
 * - スコープなし: すべてのロールを返す
 * - organizationId のみ: Organization レベルのロールのみ
 * - projectId あり: Project レベルのロール + Organization レベルのロール
 */
function filterRolesByScope(
  assignments: readonly RoleAssignment[],
  scope?: { organizationId?: string; projectId?: string },
): readonly RoleAssignment[] {
  if (!scope) {
    return assignments;
  }

  if (scope.projectId) {
    // Project スコープの場合: Project レベルまたは Organization レベルのロール
    return assignments.filter(
      (a) =>
        a.projectId === scope.projectId ||
        (a.organizationId === scope.organizationId && !a.projectId),
    );
  }

  if (scope.organizationId) {
    // Organization スコープの場合: Organization レベルのロールのみ
    return assignments.filter(
      (a) => a.organizationId === scope.organizationId && !a.projectId,
    );
  }

  return assignments;
}

/**
 * ロールが指定の権限を持つかチェック
 *
 * @param role - ロール
 * @param permission - 権限
 * @returns 権限を持つ場合 true
 */
function roleHasPermission(role: RoleType, permission: Permission): boolean {
  const permissions = RolePermissions[role];
  return permissions.includes(permission);
}

/**
 * RBAC Adapter Layer
 *
 * @remarks
 * AuthService に依存するため、Layer.effect を使用して動的に構築します。
 *
 * @example
 * ```typescript
 * const AppLayer = Layer.mergeAll(
 *   ClerkAuthLive,
 *   RBACLive,
 * );
 *
 * const program = Effect.gen(function* () {
 *   const rbac = yield* RBACService;
 *   yield* rbac.requirePermission(Permission.TEST_CASE_CREATE);
 * });
 *
 * await Effect.runPromise(program.pipe(Effect.provide(AppLayer)));
 * ```
 */
export const RBACLive = Layer.effect(
  RBACService,
  Effect.gen(function* () {
    const authService = yield* AuthService;

    return {
      /**
       * ユーザーのロール割り当てを取得
       *
       * @param userId - ユーザーID
       * @param organizationId - 組織ID (オプション)
       * @param projectId - プロジェクトID (オプション)
       * @returns ロール割り当てリスト
       *
       * @remarks
       * - DB から該当ユーザーのすべてのロール割り当てを取得
       * - スコープでフィルタリング
       * - ロールが見つからない場合は空配列を返す
       */
      getUserRoles: (
        userId: string,
        organizationId?: string,
        projectId?: string,
      ) =>
        Effect.gen(function* () {
          const dbAssignments = yield* Effect.tryPromise({
            try: () =>
              prisma.roleAssignment.findMany({
                where: { user_id: userId },
              }),
            catch: (error) =>
              new Error(
                `ロール取得エラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
              ),
          });

          const assignments = dbAssignments.map(
            mapPrismaRoleAssignmentToDomain,
          );
          const scope = organizationId
            ? { organizationId, projectId }
            : undefined;

          return filterRolesByScope(assignments, scope);
        }),

      /**
       * ユーザーが指定のロールを持つかチェック
       *
       * @param userId - ユーザーID
       * @param role - ロール
       * @param scope - スコープ (オプション)
       * @returns ロールを持つ場合 true
       *
       * @remarks
       * - スコープを考慮してロールをチェック
       * - DB エラーの場合は false を返す
       */
      hasRole: (
        userId: string,
        role: RoleType,
        scope?: { organizationId?: string; projectId?: string },
      ) =>
        Effect.gen(function* () {
          const dbAssignments = yield* Effect.tryPromise({
            try: () =>
              prisma.roleAssignment.findMany({
                where: { user_id: userId },
              }),
            catch: () => [] as const,
          }).pipe(Effect.orElseSucceed(() => [] as const));

          const assignments = dbAssignments.map(
            mapPrismaRoleAssignmentToDomain,
          );
          const filteredAssignments = filterRolesByScope(assignments, scope);

          return filteredAssignments.some((a) => a.role === role);
        }),

      /**
       * ユーザーが指定の権限を持つかチェック
       *
       * @param userId - ユーザーID
       * @param permission - 権限
       * @param scope - スコープ (オプション)
       * @returns 権限を持つ場合 true
       *
       * @remarks
       * - ユーザーのロールを取得
       * - 各ロールの権限をチェック
       * - いずれかのロールが権限を持っていれば true
       */
      hasPermission: (
        userId: string,
        permission: Permission,
        scope?: { organizationId?: string; projectId?: string },
      ) =>
        Effect.gen(function* () {
          const dbAssignments = yield* Effect.tryPromise({
            try: () =>
              prisma.roleAssignment.findMany({
                where: { user_id: userId },
              }),
            catch: () => [] as const,
          }).pipe(Effect.orElseSucceed(() => [] as const));

          const assignments = dbAssignments.map(
            mapPrismaRoleAssignmentToDomain,
          );
          const filteredAssignments = filterRolesByScope(assignments, scope);

          return filteredAssignments.some((a) =>
            roleHasPermission(a.role, permission),
          );
        }),

      /**
       * 権限を要求 (なければエラー)
       *
       * @param permission - 権限
       * @param scope - スコープ (オプション)
       * @returns void
       * @throws PermissionDeniedError - 権限がない場合
       *
       * @remarks
       * - 現在のユーザーの権限をチェック
       * - 権限がない場合は PermissionDeniedError をスロー
       * - Use Case 内で権限チェックに使用
       */
      requirePermission: (
        permission: Permission,
        scope?: { organizationId?: string; projectId?: string },
      ) =>
        Effect.gen(function* () {
          const user = yield* authService.getCurrentUser();

          const dbAssignments = yield* Effect.tryPromise({
            try: () =>
              prisma.roleAssignment.findMany({
                where: { user_id: user.id },
              }),
            catch: (error) =>
              new PermissionDeniedError(
                `権限チェックエラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
              ),
          });

          const assignments = dbAssignments.map(
            mapPrismaRoleAssignmentToDomain,
          );
          const filteredAssignments = filterRolesByScope(assignments, scope);

          const hasPermission = filteredAssignments.some((a) =>
            roleHasPermission(a.role, permission),
          );

          if (!hasPermission) {
            const scopeInfo = scope?.projectId
              ? ` (プロジェクト: ${scope.projectId})`
              : scope?.organizationId
                ? ` (組織: ${scope.organizationId})`
                : "";
            return yield* Effect.fail(
              new PermissionDeniedError(
                `権限が必要です: ${permission}${scopeInfo}`,
              ),
            );
          }
        }),

      /**
       * ロールを要求 (なければエラー)
       *
       * @param role - ロール
       * @param scope - スコープ (オプション)
       * @returns void
       * @throws PermissionDeniedError - ロールがない場合
       *
       * @remarks
       * - 現在のユーザーのロールをチェック
       * - ロールがない場合は PermissionDeniedError をスロー
       */
      requireRole: (
        role: RoleType,
        scope?: { organizationId?: string; projectId?: string },
      ) =>
        Effect.gen(function* () {
          const user = yield* authService.getCurrentUser();

          const dbAssignments = yield* Effect.tryPromise({
            try: () =>
              prisma.roleAssignment.findMany({
                where: { user_id: user.id },
              }),
            catch: (error) =>
              new PermissionDeniedError(
                `ロールチェックエラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
              ),
          });

          const assignments = dbAssignments.map(
            mapPrismaRoleAssignmentToDomain,
          );
          const filteredAssignments = filterRolesByScope(assignments, scope);

          const hasRole = filteredAssignments.some((a) => a.role === role);

          if (!hasRole) {
            const scopeInfo = scope?.projectId
              ? ` (プロジェクト: ${scope.projectId})`
              : scope?.organizationId
                ? ` (組織: ${scope.organizationId})`
                : "";
            return yield* Effect.fail(
              new PermissionDeniedError(
                `ロールが必要です: ${role}${scopeInfo}`,
                role,
              ),
            );
          }
        }),

      /**
       * ユーザーにロールを割り当て
       *
       * @param userId - ユーザーID
       * @param role - ロール
       * @param scope - スコープ (オプション)
       * @returns 割り当てられた RoleAssignment
       * @throws PermissionDeniedError - DB エラーの場合
       *
       * @remarks
       * - 新しいロール割り当てを DB に作成
       * - 同じロール割り当てが既に存在する場合は Prisma がエラーを返す
       * - このメソッドを実行するには ROLE_ASSIGN 権限が必要
       */
      assignRole: (
        userId: string,
        role: RoleType,
        scope?: { organizationId?: string; projectId?: string },
      ) =>
        Effect.gen(function* () {
          const input: CreateRoleAssignmentInput = {
            userId,
            role,
            organizationId: scope?.organizationId,
            projectId: scope?.projectId,
          };

          const dbAssignment = yield* Effect.tryPromise({
            try: () =>
              prisma.roleAssignment.create({
                data: {
                  user_id: input.userId,
                  role: input.role,
                  organization_id: input.organizationId ?? null,
                  project_id: input.projectId ?? null,
                },
              }),
            catch: (error) =>
              new PermissionDeniedError(
                `ロール割り当てエラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
              ),
          });

          return mapPrismaRoleAssignmentToDomain(dbAssignment);
        }),

      /**
       * ロール割り当てを削除
       *
       * @param assignmentId - ロール割り当てID
       * @returns void
       * @throws PermissionDeniedError - DB エラーの場合
       *
       * @remarks
       * - ロール割り当てを DB から削除
       * - このメソッドを実行するには ROLE_ASSIGN 権限が必要
       */
      revokeRole: (assignmentId: string) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () =>
              prisma.roleAssignment.delete({
                where: { id: assignmentId },
              }),
            catch: (error) =>
              new PermissionDeniedError(
                `ロール削除エラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
              ),
          });
        }),
    };
  }),
);
