import { Data } from "effect";

/**
 * User Domain Model
 *
 * システムユーザーを表すドメインモデル
 *
 * @remarks
 * - Effect TS の Data.Class を使用した不変オブジェクト
 * - OIDC (Clerk) の subject identifier と紐付け
 * - Organization単位でユーザーを管理
 */
export class User extends Data.Class<{
  readonly id: string;
  readonly organizationId: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly oidcSub?: string; // OIDC subject identifier (Clerk user ID)
  readonly createdAt: Date;
  readonly updatedAt: Date;
}> {
  /**
   * ユーザーの表示名を取得
   */
  get displayName(): string {
    return this.name || this.email.split("@")[0];
  }

  /**
   * アバター画像URLを取得（デフォルト含む）
   */
  getAvatarUrl(fallback?: string): string {
    return this.avatarUrl || fallback || this.generateGravatarUrl();
  }

  /**
   * Gravatarを生成
   */
  private generateGravatarUrl(): string {
    // TODO: 実際にはメールアドレスのMD5ハッシュを使用
    const hash = this.email; // Simplification
    return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
  }

  /**
   * OIDCプロバイダーと連携しているか
   */
  get isOIDCLinked(): boolean {
    return !!this.oidcSub;
  }
}

/**
 * User作成用の入力型
 */
export type CreateUserInput = {
  readonly organizationId: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly oidcSub?: string;
};

/**
 * User更新用の入力型
 */
export type UpdateUserInput = {
  readonly name?: string;
  readonly avatarUrl?: string;
};
