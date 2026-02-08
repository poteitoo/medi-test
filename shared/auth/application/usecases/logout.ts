import { Effect } from "effect";
import { AuthService } from "@shared/auth/application/ports/auth-service";

/**
 * Logout Use Case
 *
 * 現在のセッションを終了し、ユーザーをログアウトさせる
 *
 * @returns ログアウト処理の Effect
 *
 * @remarks
 * **動作:**
 * 1. AuthService.signOut() を呼び出してセッションを無効化
 * 2. クライアント側で Clerk のログアウト処理を実行
 *
 * **使用方法:**
 * - React Router の action 関数内で実行
 * - ログアウト後は /login にリダイレクト
 *
 * **Clerk との統合:**
 * - サーバー側: AuthService.signOut() (通常は何もしない)
 * - クライアント側: `useClerk().signOut()` を呼び出す
 *
 * @example
 * ```typescript
 * // presentation/pages/logout-page.tsx (Action)
 * import { redirect } from "react-router";
 * import { Effect } from "effect";
 * import { logout } from "@shared/auth/application/usecases/logout";
 * import { ClerkAuthLive } from "@shared/auth/infrastructure/clerk-auth-adapter";
 *
 * export async function action() {
 *   const program = logout();
 *   await Effect.runPromise(program.pipe(Effect.provide(ClerkAuthLive)));
 *   return redirect("/login");
 * }
 * ```
 *
 * @example
 * ```typescript
 * // presentation/components/logout-button.tsx (Client)
 * import { useClerk } from "@clerk/clerk-react";
 * import { Form } from "react-router";
 *
 * export function LogoutButton() {
 *   const clerk = useClerk();
 *
 *   return (
 *     <Form
 *       method="post"
 *       action="/logout"
 *       onSubmit={async (e) => {
 *         e.preventDefault();
 *         await clerk.signOut();
 *         window.location.href = "/login";
 *       }}
 *     >
 *       <button type="submit">ログアウト</button>
 *     </Form>
 *   );
 * }
 * ```
 */
export const logout = () =>
  Effect.gen(function* () {
    const auth = yield* AuthService;
    yield* auth.signOut();
  });
