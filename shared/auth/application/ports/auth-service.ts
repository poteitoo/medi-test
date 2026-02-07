import { Context, Effect } from "effect";
import type { User } from "~/shared/auth/domain/models/user";

/**
 * Authentication Errors
 */
export class AuthenticationError extends Error {
  readonly _tag = "AuthenticationError";
  constructor(readonly message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class UnauthorizedError extends Error {
  readonly _tag = "UnauthorizedError";
  constructor(readonly message: string = "認証が必要です") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Session情報
 */
export type SessionInfo = {
  readonly userId: string;
  readonly organizationId: string;
  readonly sessionId: string;
  readonly expiresAt: Date;
};

/**
 * AuthService Port
 *
 * 認証サービスの抽象インターフェース
 *
 * @remarks
 * - Clerk などの OIDC プロバイダーと統合
 * - セッション管理とユーザー認証を提供
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const authService = yield* AuthService;
 *   const user = yield* authService.getCurrentUser();
 *   return user;
 * });
 * ```
 */
export class AuthService extends Context.Tag("AuthService")<
  AuthService,
  {
    /**
     * 現在のログインユーザーを取得
     */
    readonly getCurrentUser: () => Effect.Effect<User, UnauthorizedError>;

    /**
     * セッション情報を取得
     */
    readonly getSession: () => Effect.Effect<SessionInfo, UnauthorizedError>;

    /**
     * ユーザーIDからユーザーを取得
     */
    readonly getUserById: (
      userId: string,
    ) => Effect.Effect<User, AuthenticationError>;

    /**
     * メールアドレスからユーザーを取得
     */
    readonly getUserByEmail: (
      email: string,
    ) => Effect.Effect<User | null, AuthenticationError>;

    /**
     * ログアウト
     */
    readonly signOut: () => Effect.Effect<void, never>;

    /**
     * 認証済みかチェック
     */
    readonly isAuthenticated: () => Effect.Effect<boolean, never>;
  }
>() {}
