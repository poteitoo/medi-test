import { Effect } from "effect";
import { AuthService } from "../ports/auth-service";

/**
 * ログアウトユースケース
 *
 * 現在のセッションを終了し、ユーザーをログアウトさせる
 *
 * @returns ログアウト処理の Effect
 *
 * @example
 * const program = logout().pipe(Effect.provide(ClerkAuthAdapter));
 * await Effect.runPromise(program);
 */
export const logout = () =>
  Effect.gen(function* () {
    const auth = yield* AuthService;
    yield* auth.signOut();
  });
