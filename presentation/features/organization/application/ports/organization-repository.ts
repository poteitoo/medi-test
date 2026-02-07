import { Context, Effect } from "effect";
import type { Organization } from "../../domain/models/organization";

/**
 * Organization Repository エラー
 */
export class OrganizationNotFoundError extends Error {
  readonly _tag = "OrganizationNotFoundError";
  constructor(message: string = "組織が見つかりません") {
    super(message);
    this.name = "OrganizationNotFoundError";
  }
}

export class OrganizationAlreadyExistsError extends Error {
  readonly _tag = "OrganizationAlreadyExistsError";
  constructor(message: string = "組織が既に存在します") {
    super(message);
    this.name = "OrganizationAlreadyExistsError";
  }
}

/**
 * Organization Repository Port
 *
 * 組織データへのアクセスを抽象化するポート
 */
export class OrganizationRepository extends Context.Tag(
  "OrganizationRepository",
)<
  OrganizationRepository,
  {
    /**
     * IDで組織を取得
     */
    readonly findById: (
      id: string,
    ) => Effect.Effect<Organization, OrganizationNotFoundError>;

    /**
     * スラッグで組織を取得
     */
    readonly findBySlug: (
      slug: string,
    ) => Effect.Effect<Organization, OrganizationNotFoundError>;

    /**
     * すべての組織を取得
     */
    readonly findAll: () => Effect.Effect<readonly Organization[], Error>;

    /**
     * 組織を作成
     */
    readonly create: (input: {
      readonly name: string;
      readonly slug: string;
      readonly description?: string;
      readonly logoUrl?: string;
    }) => Effect.Effect<Organization, OrganizationAlreadyExistsError>;

    /**
     * 組織を更新
     */
    readonly update: (
      id: string,
      input: {
        readonly name?: string;
        readonly slug?: string;
        readonly description?: string;
        readonly logoUrl?: string;
      },
    ) => Effect.Effect<Organization, OrganizationNotFoundError>;

    /**
     * 組織を削除
     */
    readonly delete: (
      id: string,
    ) => Effect.Effect<void, OrganizationNotFoundError>;
  }
>() {}
