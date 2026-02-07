import { Context, Effect } from "effect";
import type { RoleType, RoleAssignment } from "~/shared/auth/domain/models/role-assignment";

/**
 * Permission Errors
 */
export class PermissionDeniedError extends Error {
  readonly _tag = "PermissionDeniedError";
  constructor(
    readonly message: string = "権限がありません",
    readonly requiredRole?: RoleType,
  ) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Permission定義
 *
 * システムで使用可能な権限一覧
 */
export const Permission = {
  // Test Case Management
  TEST_CASE_CREATE: "test_case:create",
  TEST_CASE_READ: "test_case:read",
  TEST_CASE_UPDATE: "test_case:update",
  TEST_CASE_DELETE: "test_case:delete",
  TEST_CASE_APPROVE: "test_case:approve",

  // Test Execution
  TEST_RUN_CREATE: "test_run:create",
  TEST_RUN_EXECUTE: "test_run:execute",
  TEST_RUN_MANAGE: "test_run:manage",

  // Release Management
  RELEASE_CREATE: "release:create",
  RELEASE_APPROVE: "release:approve",
  RELEASE_MANAGE: "release:manage",

  // Organization Management
  ORG_MANAGE: "org:manage",
  PROJECT_CREATE: "project:create",
  PROJECT_MANAGE: "project:manage",

  // User Management
  USER_INVITE: "user:invite",
  USER_MANAGE: "user:manage",
  ROLE_ASSIGN: "role:assign",

  // Audit
  AUDIT_VIEW: "audit:view",
  AUDIT_EXPORT: "audit:export",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

/**
 * ロールと権限のマッピング
 */
export const RolePermissions: Record<RoleType, readonly Permission[]> = {
  ADMIN: [
    // すべての権限
    Permission.TEST_CASE_CREATE,
    Permission.TEST_CASE_READ,
    Permission.TEST_CASE_UPDATE,
    Permission.TEST_CASE_DELETE,
    Permission.TEST_CASE_APPROVE,
    Permission.TEST_RUN_CREATE,
    Permission.TEST_RUN_EXECUTE,
    Permission.TEST_RUN_MANAGE,
    Permission.RELEASE_CREATE,
    Permission.RELEASE_APPROVE,
    Permission.RELEASE_MANAGE,
    Permission.ORG_MANAGE,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_MANAGE,
    Permission.USER_INVITE,
    Permission.USER_MANAGE,
    Permission.ROLE_ASSIGN,
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,
  ],
  QA_MANAGER: [
    Permission.TEST_CASE_CREATE,
    Permission.TEST_CASE_READ,
    Permission.TEST_CASE_UPDATE,
    Permission.TEST_CASE_DELETE,
    Permission.TEST_CASE_APPROVE,
    Permission.TEST_RUN_CREATE,
    Permission.TEST_RUN_EXECUTE,
    Permission.TEST_RUN_MANAGE,
    Permission.RELEASE_APPROVE,
    Permission.PROJECT_MANAGE,
    Permission.USER_INVITE,
    Permission.AUDIT_VIEW,
  ],
  QA_ENGINEER: [
    Permission.TEST_CASE_CREATE,
    Permission.TEST_CASE_READ,
    Permission.TEST_CASE_UPDATE,
    Permission.TEST_RUN_CREATE,
    Permission.TEST_RUN_EXECUTE,
  ],
  DEVELOPER: [
    Permission.TEST_CASE_READ,
    Permission.TEST_RUN_EXECUTE,
  ],
  PM_PO: [
    Permission.TEST_CASE_READ,
    Permission.TEST_RUN_CREATE,
    Permission.RELEASE_CREATE,
    Permission.PROJECT_MANAGE,
  ],
  AUDITOR: [
    Permission.TEST_CASE_READ,
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,
  ],
};

/**
 * RBACService Port
 *
 * Role-Based Access Control サービスの抽象インターフェース
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const rbac = yield* RBACService;
 *   
 *   // 権限チェック
 *   yield* rbac.requirePermission(Permission.TEST_CASE_CREATE);
 *   
 *   // ロールチェック
 *   const isAdmin = yield* rbac.hasRole(RoleType.ADMIN);
 *   
 *   return "OK";
 * });
 * ```
 */
export class RBACService extends Context.Tag("RBACService")<
  RBACService,
  {
    /**
     * ユーザーのロール割り当てを取得
     */
    readonly getUserRoles: (
      userId: string,
      organizationId?: string,
      projectId?: string,
    ) => Effect.Effect<readonly RoleAssignment[], never>;

    /**
     * ユーザーが指定のロールを持つかチェック
     */
    readonly hasRole: (
      userId: string,
      role: RoleType,
      scope?: { organizationId?: string; projectId?: string },
    ) => Effect.Effect<boolean, never>;

    /**
     * ユーザーが指定の権限を持つかチェック
     */
    readonly hasPermission: (
      userId: string,
      permission: Permission,
      scope?: { organizationId?: string; projectId?: string },
    ) => Effect.Effect<boolean, never>;

    /**
     * 権限を要求（なければエラー）
     */
    readonly requirePermission: (
      permission: Permission,
      scope?: { organizationId?: string; projectId?: string },
    ) => Effect.Effect<void, PermissionDeniedError>;

    /**
     * ロールを要求（なければエラー）
     */
    readonly requireRole: (
      role: RoleType,
      scope?: { organizationId?: string; projectId?: string },
    ) => Effect.Effect<void, PermissionDeniedError>;

    /**
     * ロールにロールを割り当て
     */
    readonly assignRole: (
      userId: string,
      role: RoleType,
      scope?: { organizationId?: string; projectId?: string },
    ) => Effect.Effect<RoleAssignment, PermissionDeniedError>;

    /**
     * ロール割り当てを削除
     */
    readonly revokeRole: (
      assignmentId: string,
    ) => Effect.Effect<void, PermissionDeniedError>;
  }
>() {}
