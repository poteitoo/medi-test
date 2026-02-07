import { Context, Effect } from "effect";
import type {
  RoleAssignment,
  RoleType,
} from "../../domain/models/role-assignment";

/**
 * 権限エラー
 */
export class ForbiddenError extends Error {
  readonly _tag = "ForbiddenError";
  constructor(message: string = "権限がありません") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class RoleNotFoundError extends Error {
  readonly _tag = "RoleNotFoundError";
  constructor(message: string) {
    super(message);
    this.name = "RoleNotFoundError";
  }
}

/**
 * RBAC Service Port (Effect Tag)
 *
 * ロールベースアクセス制御の抽象化
 */
export class RBACService extends Context.Tag("RBACService")<
  RBACService,
  {
    /**
     * ユーザーのロール割り当てを取得
     */
    readonly getUserRoles: (
      userId: string,
    ) => Effect.Effect<readonly RoleAssignment[], RoleNotFoundError>;

    /**
     * ユーザーが特定のロールを持っているか確認
     */
    readonly hasRole: (
      userId: string,
      role: RoleType,
      scope?: { organizationId?: string; projectId?: string },
    ) => Effect.Effect<boolean, never>;

    /**
     * ユーザーが特定のロールを持っていることを要求（なければエラー）
     */
    readonly requireRole: (
      userId: string,
      role: RoleType,
      scope?: { organizationId?: string; projectId?: string },
    ) => Effect.Effect<void, ForbiddenError>;

    /**
     * ユーザーが複数のロールのいずれかを持っているか確認
     */
    readonly hasAnyRole: (
      userId: string,
      roles: readonly RoleType[],
      scope?: { organizationId?: string; projectId?: string },
    ) => Effect.Effect<boolean, never>;

    /**
     * ユーザーが複数のロールのいずれかを持っていることを要求
     */
    readonly requireAnyRole: (
      userId: string,
      roles: readonly RoleType[],
      scope?: { organizationId?: string; projectId?: string },
    ) => Effect.Effect<void, ForbiddenError>;

    /**
     * ロール割り当てを作成
     */
    readonly assignRole: (input: {
      readonly userId: string;
      readonly role: RoleType;
      readonly organizationId?: string;
      readonly projectId?: string;
    }) => Effect.Effect<RoleAssignment, Error>;

    /**
     * ロール割り当てを削除
     */
    readonly revokeRole: (
      roleAssignmentId: string,
    ) => Effect.Effect<void, Error>;
  }
>() {}
