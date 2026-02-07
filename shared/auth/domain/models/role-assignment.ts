import { Data } from "effect";

/**
 * ロールタイプ (Prisma enumに対応)
 */
export type RoleType =
  | "ADMIN"
  | "QA_MANAGER"
  | "QA_ENGINEER"
  | "DEVELOPER"
  | "PM_PO"
  | "AUDITOR";

/**
 * ロール割り当てドメインモデル
 */
export class RoleAssignment extends Data.Class<{
  readonly id: string;
  readonly userId: string;
  readonly organizationId?: string;
  readonly projectId?: string;
  readonly role: RoleType;
  readonly createdAt: Date;
}> {}

/**
 * ロール割り当て作成入力
 */
export class CreateRoleAssignmentInput extends Data.Class<{
  readonly userId: string;
  readonly organizationId?: string;
  readonly projectId?: string;
  readonly role: RoleType;
}> {}

/**
 * ロールチェック用ヘルパー
 */
export const hasRole = (
  assignments: readonly RoleAssignment[],
  role: RoleType,
  scope?: { organizationId?: string; projectId?: string },
): boolean => {
  return assignments.some((assignment) => {
    const roleMatches = assignment.role === role;
    const scopeMatches =
      (!scope?.organizationId ||
        assignment.organizationId === scope.organizationId) &&
      (!scope?.projectId || assignment.projectId === scope.projectId);
    return roleMatches && scopeMatches;
  });
};

/**
 * 管理者権限チェック
 */
export const isAdmin = (assignments: readonly RoleAssignment[]): boolean => {
  return hasRole(assignments, "ADMIN");
};

/**
 * QAマネージャー権限チェック
 */
export const isQAManager = (
  assignments: readonly RoleAssignment[],
  scope?: { organizationId?: string; projectId?: string },
): boolean => {
  return hasRole(assignments, "QA_MANAGER", scope);
};
