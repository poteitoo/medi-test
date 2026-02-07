import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { Effect } from "effect";
import { AuthService } from "@shared/auth/application/ports/auth-service";
import { ClerkAuthLive } from "@shared/auth/infrastructure/clerk-auth-adapter";
import type { User } from "@shared/auth/domain/models/user";

/**
 * Auth Loader Middleware
 *
 * React Router のローダー関数で認証を要求するミドルウェア
 *
 * @remarks
 * **使用方法:**
 * 1. `requireAuth`: 認証が必須。未認証の場合は /login にリダイレクト
 * 2. `optionalAuth`: 認証はオプション。未認証でもリダイレクトしない
 *
 * **Effect TS 統合:**
 * - AuthService を使用してユーザー情報を取得
 * - Effect プログラムを runPromise で実行
 * - エラーは適切にハンドリングしてリダイレクト
 *
 * @example
 * ```typescript
 * // presentation/pages/dashboard-page.tsx
 * import { requireAuth } from "@shared/auth/ui/middleware/auth-loader";
 *
 * export const loader = requireAuth(async ({ request, user }) => {
 *   // user は認証済み User インスタンス
 *   const data = await fetchDashboardData(user.id);
 *   return { data };
 * });
 *
 * export default function DashboardPage() {
 *   const { data } = useLoaderData<typeof loader>();
 *   // ...
 * }
 * ```
 */

/**
 * 認証済みユーザー情報を含むローダーコンテキスト
 */
export type AuthenticatedLoaderContext = {
  readonly user: User;
};

/**
 * 認証が必要なローダーを保護するミドルウェア
 *
 * @param loaderFn - 認証済みユーザーを受け取るローダー関数
 * @returns React Router loader 関数
 *
 * @remarks
 * **動作:**
 * 1. AuthService.getCurrentUser() を実行
 * 2. 成功: ユーザー情報を loaderFn に渡して実行
 * 3. 失敗 (UnauthorizedError): /login にリダイレクト
 * 4. 失敗 (その他): エラーをスロー
 *
 * **リダイレクト URL:**
 * - 元のURLを redirect クエリパラメータに保存
 * - ログイン後に元のページに戻れるようにする
 *
 * @example
 * ```typescript
 * export const loader = requireAuth(async ({ request, user }) => {
 *   // user.id, user.email, user.name などが利用可能
 *   const testCases = await fetchTestCases(user.organizationId);
 *   return { testCases };
 * });
 * ```
 */
export function requireAuth<T>(
  loaderFn: (
    args: LoaderFunctionArgs & AuthenticatedLoaderContext,
  ) => Promise<T> | T,
) {
  return async (args: LoaderFunctionArgs): Promise<T> => {
    const program = Effect.gen(function* () {
      const authService = yield* AuthService;
      const user = yield* authService.getCurrentUser();
      return user;
    });

    try {
      const user = await Effect.runPromise(
        program.pipe(Effect.provide(ClerkAuthLive)),
      );

      // 認証済みユーザー情報を追加してローダー関数を実行
      return await loaderFn({ ...args, user });
    } catch (error) {
      // UnauthorizedError の場合はログイン画面にリダイレクト
      if (
        error instanceof Error &&
        (error.name === "UnauthorizedError" ||
          error.message.includes("認証が必要です"))
      ) {
        const loginUrl = new URL("/login", args.request.url);
        loginUrl.searchParams.set("redirect", args.request.url);
        throw redirect(loginUrl.toString());
      }

      // その他のエラーはそのままスロー
      throw error;
    }
  };
}

/**
 * オプショナル認証ミドルウェア
 *
 * @param loaderFn - ユーザー情報をオプションで受け取るローダー関数
 * @returns React Router loader 関数
 *
 * @remarks
 * **動作:**
 * - 認証されている場合: ユーザー情報を渡す
 * - 未認証の場合: user = undefined で loaderFn を実行
 * - リダイレクトは行わない
 *
 * **ユースケース:**
 * - 公開ページだが、ログインユーザーには追加情報を表示
 * - ログイン状態によって UI を切り替える
 *
 * @example
 * ```typescript
 * export const loader = optionalAuth(async ({ request, user }) => {
 *   const publicData = await fetchPublicData();
 *   const privateData = user ? await fetchPrivateData(user.id) : null;
 *   return { publicData, privateData, isAuthenticated: !!user };
 * });
 * ```
 */
export function optionalAuth<T>(
  loaderFn: (
    args: LoaderFunctionArgs & { user?: User },
  ) => Promise<T> | T,
) {
  return async (args: LoaderFunctionArgs): Promise<T> => {
    const program = Effect.gen(function* () {
      const authService = yield* AuthService;
      const user = yield* authService.getCurrentUser();
      return user;
    });

    try {
      const user = await Effect.runPromise(
        program.pipe(Effect.provide(ClerkAuthLive)),
      );

      // 認証済みの場合はユーザー情報を渡す
      return await loaderFn({ ...args, user });
    } catch (error) {
      // 認証エラーの場合は user = undefined で続行
      if (
        error instanceof Error &&
        (error.name === "UnauthorizedError" ||
          error.message.includes("認証が必要です"))
      ) {
        return await loaderFn({ ...args, user: undefined });
      }

      // その他のエラーはスロー
      throw error;
    }
  };
}

/**
 * 認証チェックのみを行うヘルパー
 *
 * @param request - React Router request
 * @returns 認証済みの場合 User、未認証の場合 null
 *
 * @remarks
 * ローダー関数内で直接認証状態をチェックしたい場合に使用
 *
 * @example
 * ```typescript
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   const user = await checkAuth(request);
 *   if (!user) {
 *     throw redirect("/login");
 *   }
 *   return { user };
 * }
 * ```
 */
export async function checkAuth(
  request: LoaderFunctionArgs["request"],
): Promise<User | null> {
  const program = Effect.gen(function* () {
    const authService = yield* AuthService;
    const user = yield* authService.getCurrentUser();
    return user;
  });

  try {
    const user = await Effect.runPromise(
      program.pipe(Effect.provide(ClerkAuthLive)),
    );
    return user;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "UnauthorizedError" ||
        error.message.includes("認証が必要です"))
    ) {
      return null;
    }
    throw error;
  }
}
