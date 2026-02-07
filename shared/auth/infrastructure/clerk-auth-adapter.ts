import { Effect, Layer } from "effect";
import { useAuth, useUser } from "@clerk/react-router";
import {
  AuthService,
  AuthenticationError,
  UnauthorizedError,
  type AuthenticatedUser,
} from "../application/ports/auth-service";

/**
 * Clerk Auth Adapter実装
 *
 * Clerkを使用してAuthServiceを実装
 */
export const ClerkAuthAdapter = Layer.succeed(AuthService, {
  getCurrentUser: () =>
    Effect.gen(function* () {
      // Note: React Hooksは通常のEffect内では使用できないため、
      // 実際の実装ではReactコンポーネント側で取得した情報を渡す必要があります
      // ここではプレースホルダーとして実装
      return Effect.fail(
        new UnauthorizedError("Clerk context is not available"),
      );
    }).pipe(Effect.flatten),

  getUserById: (userId: string) =>
    Effect.gen(function* () {
      // Clerk APIを使用してユーザー情報を取得
      // 実装時にはClerkのバックエンドAPIを使用
      return Effect.fail(new AuthenticationError(`User not found: ${userId}`));
    }).pipe(Effect.flatten),

  verifySession: (token: string) =>
    Effect.gen(function* () {
      // Clerkのセッション検証
      // 実装時にはClerkのverifyTokenを使用
      return Effect.fail(new UnauthorizedError("Invalid session token"));
    }).pipe(Effect.flatten),

  signOut: () =>
    Effect.gen(function* () {
      // Clerkのサインアウト処理
      // 実装時にはuseAuth().signOut()を使用
      return Effect.succeed(undefined);
    }).pipe(Effect.flatten),
});

/**
 * Clerk Hooks から AuthenticatedUser を構築するヘルパー
 *
 * React コンポーネント内で使用
 */
export const useClerkAuthenticatedUser = (): AuthenticatedUser | undefined => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isSignedIn || !user) {
    return undefined;
  }

  return {
    clerkUserId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? "",
    name: user.fullName ?? user.username ?? "Unknown",
    avatarUrl: user.imageUrl,
  };
};
