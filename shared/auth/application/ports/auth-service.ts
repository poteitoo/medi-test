import { Context, Effect } from "effect";
import type { User } from "../../domain/models/user";

/**
 * 認証エラー
 */
export class AuthenticationError extends Error {
  readonly _tag = "AuthenticationError";
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class UnauthorizedError extends Error {
  readonly _tag = "UnauthorizedError";
  constructor(message: string = "認証されていません") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * 現在の認証ユーザー情報
 */
export interface AuthenticatedUser {
  readonly clerkUserId: string; // Clerk user ID
  readonly email: string;
  readonly name: string;
  readonly avatarUrl?: string;
}

/**
 * AuthService Port (Effect Tag)
 *
 * 認証プロバイダー（Clerk）に依存しない抽象化
 */
export class AuthService extends Context.Tag("AuthService")<
  AuthService,
  {
    /**
     * 現在の認証ユーザーを取得
     */
    readonly getCurrentUser: () => Effect.Effect<
      AuthenticatedUser,
      UnauthorizedError
    >;

    /**
     * ユーザーIDから認証情報を取得
     */
    readonly getUserById: (
      userId: string,
    ) => Effect.Effect<AuthenticatedUser, AuthenticationError>;

    /**
     * ユーザーのセッションを検証
     */
    readonly verifySession: (
      token: string,
    ) => Effect.Effect<AuthenticatedUser, UnauthorizedError>;

    /**
     * サインアウト
     */
    readonly signOut: () => Effect.Effect<void, never>;
  }
>() {}
