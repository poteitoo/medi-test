import { Data } from "effect";

/**
 * ユーザードメインモデル
 * Prisma User エンティティに対応
 */
export class User extends Data.Class<{
  readonly id: string;
  readonly organizationId: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly oidcSub?: string; // Clerk user ID
  readonly createdAt: Date;
  readonly updatedAt: Date;
}> {}

/**
 * ユーザー作成入力
 */
export class CreateUserInput extends Data.Class<{
  readonly organizationId: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly oidcSub?: string;
}> {}

/**
 * ユーザー更新入力
 */
export class UpdateUserInput extends Data.Class<{
  readonly name?: string;
  readonly avatarUrl?: string;
}> {}
