import { Data } from "effect";

/**
 * Role Type
 *
 * システムで利用可能なロール一覧
 */
export const RoleType = {
  ADMIN: "ADMIN",
  QA_MANAGER: "QA_MANAGER",
  QA_ENGINEER: "QA_ENGINEER",
  DEVELOPER: "DEVELOPER",
  PM_PO: "PM_PO",
  AUDITOR: "AUDITOR",
} as const;

export type RoleType = (typeof RoleType)[keyof typeof RoleType];

/**
 * Role Assignment Domain Model
 *
 * ユーザーとロールの紐付けを表すドメインモデル
 *
 * @remarks
 * - Organization レベルまたは Project レベルでロールを割り当て
 * - 階層的な権限管理をサポート
 */
export class RoleAssignment extends Data.Class<{
  readonly id: string;
  readonly userId: string;
  readonly organizationId?: string;
  readonly projectId?: string;
  readonly role: RoleType;
  readonly createdAt: Date;
}> {
  /**
   * Organization レベルのロール割り当てか
   */
  get isOrganizationLevel(): boolean {
    return !!this.organizationId && !this.projectId;
  }

  /**
   * Project レベルのロール割り当てか
   */
  get isProjectLevel(): boolean {
    return !!this.projectId;
  }

  /**
   * 管理者権限を持つか
   */
  get isAdmin(): boolean {
    return this.role === RoleType.ADMIN;
  }

  /**
   * QA Manager権限を持つか
   */
  get isQAManager(): boolean {
    return this.role === RoleType.QA_MANAGER;
  }

  /**
   * ロールの表示名を取得
   */
  get roleDisplayName(): string {
    const displayNames: Record<RoleType, string> = {
      [RoleType.ADMIN]: "管理者",
      [RoleType.QA_MANAGER]: "QAマネージャー",
      [RoleType.QA_ENGINEER]: "QAエンジニア",
      [RoleType.DEVELOPER]: "開発者",
      [RoleType.PM_PO]: "PM/PO",
      [RoleType.AUDITOR]: "監査人",
    };
    return displayNames[this.role];
  }

  /**
   * スコープの表示名を取得
   */
  get scopeDisplayName(): string {
    if (this.isOrganizationLevel) {
      return "組織全体";
    }
    if (this.isProjectLevel) {
      return `プロジェクト (${this.projectId})`;
    }
    return "未定義";
  }
}

/**
 * RoleAssignment作成用の入力型
 */
export type CreateRoleAssignmentInput = {
  readonly userId: string;
  readonly role: RoleType;
  readonly organizationId?: string;
  readonly projectId?: string;
};

/**
 * ロール権限レベル
 *
 * ロールの階層関係を定義
 */
export const RoleHierarchy: Record<RoleType, number> = {
  [RoleType.ADMIN]: 100,
  [RoleType.QA_MANAGER]: 80,
  [RoleType.QA_ENGINEER]: 60,
  [RoleType.DEVELOPER]: 40,
  [RoleType.PM_PO]: 40,
  [RoleType.AUDITOR]: 20,
};

/**
 * ロールAがロールBより上位か判定
 */
export function isRoleHigherThan(roleA: RoleType, roleB: RoleType): boolean {
  return RoleHierarchy[roleA] > RoleHierarchy[roleB];
}
