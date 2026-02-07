import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import type { AuthenticatedUser } from "../../application/ports/auth-service";

/**
 * 認証済みユーザー情報を含むローダーコンテキスト
 */
export type AuthenticatedLoaderContext = {
  user: AuthenticatedUser;
};

/**
 * 認証が必要なローダーを保護するミドルウェア
 *
 * 未認証の場合はログイン画面にリダイレクト
 *
 * @example
 * export const loader = requireAuth(async ({ request, user }) => {
 *   // userは認証済みユーザー情報
 *   return { data: await fetchData(user.clerkUserId) };
 * });
 */
export function requireAuth<T>(
  loaderFn: (
    args: LoaderFunctionArgs & AuthenticatedLoaderContext,
  ) => Promise<T> | T,
) {
  return async (args: LoaderFunctionArgs): Promise<T> => {
    const { userId } = await getAuth(args);

    // 未認証の場合はログイン画面にリダイレクト
    if (!userId) {
      const loginUrl = new URL("/login", args.request.url);
      loginUrl.searchParams.set("redirect", args.request.url);
      throw redirect(loginUrl.toString());
    }

    // Clerk の認証情報から AuthenticatedUser を構築
    // Note: Clerk の getAuth() は userId のみを返すため、
    // 実際の実装ではユーザー情報を Prisma から取得する必要があります
    const user: AuthenticatedUser = {
      clerkUserId: userId,
      email: "", // Prismaから取得
      name: "", // Prismaから取得
      avatarUrl: undefined, // Prismaから取得
    };

    // 認証済みユーザー情報を追加してローダー関数を実行
    return loaderFn({ ...args, user });
  };
}

/**
 * オプショナル認証ミドルウェア
 *
 * 認証されている場合はユーザー情報を渡し、未認証でもリダイレクトしない
 *
 * @example
 * export const loader = optionalAuth(async ({ request, user }) => {
 *   // user は AuthenticatedUser | undefined
 *   return { data: await fetchData(user?.clerkUserId) };
 * });
 */
export function optionalAuth<T>(
  loaderFn: (
    args: LoaderFunctionArgs & { user?: AuthenticatedUser },
  ) => Promise<T> | T,
) {
  return async (args: LoaderFunctionArgs): Promise<T> => {
    const { userId } = await getAuth(args);

    if (!userId) {
      return loaderFn({ ...args, user: undefined });
    }

    // 認証済みの場合はユーザー情報を構築
    const user: AuthenticatedUser = {
      clerkUserId: userId,
      email: "", // Prismaから取得
      name: "", // Prismaから取得
      avatarUrl: undefined, // Prismaから取得
    };

    return loaderFn({ ...args, user });
  };
}
