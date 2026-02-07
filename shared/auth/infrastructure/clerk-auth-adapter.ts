import { Effect, Layer } from "effect";
import type { User as ClerkUser } from "@clerk/clerk-sdk-node";
import {
  AuthService,
  AuthenticationError,
  UnauthorizedError,
  type SessionInfo,
} from "@shared/auth/application/ports/auth-service";
import { User } from "@shared/auth/domain/models/user";
import { prisma } from "@shared/db/client";

/**
 * Clerk Auth Adapter
 *
 * Clerk SDK を使用した AuthService の実装
 *
 * @remarks
 * **セットアップ要件:**
 * 1. `@clerk/clerk-sdk-node` と `@clerk/clerk-react` パッケージのインストール:
 *    ```bash
 *    pnpm add @clerk/clerk-sdk-node @clerk/clerk-react
 *    ```
 *
 * 2. 環境変数の設定 (.env):
 *    ```
 *    CLERK_SECRET_KEY=sk_test_xxxxx
 *    CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
 *    DEFAULT_ORGANIZATION_ID=your-org-id
 *    ```
 *
 * 3. React側の設定 (app/root.tsx):
 *    ```tsx
 *    import { ClerkProvider } from "@clerk/clerk-react";
 *
 *    export default function Root() {
 *      return (
 *        <ClerkProvider publishableKey={ENV.CLERK_PUBLISHABLE_KEY}>
 *          <Outlet />
 *        </ClerkProvider>
 *      );
 *    }
 *    ```
 *
 * **アーキテクチャ:**
 * - Clerk の User を Domain の User モデルにマッピング
 * - ユーザー情報は Prisma DB に永続化
 * - セッション情報は Clerk から取得
 * - OIDC subject identifier (oidc_sub) で Clerk と連携
 *
 * **エラーハンドリング:**
 * - 未認証: UnauthorizedError をスロー
 * - Clerk API エラー: AuthenticationError をスロー
 * - DB エラー: AuthenticationError をスロー
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const authService = yield* AuthService;
 *   const user = yield* authService.getCurrentUser();
 *   console.log(`ログインユーザー: ${user.displayName}`);
 * });
 *
 * const result = await Effect.runPromise(
 *   program.pipe(Effect.provide(ClerkAuthLive))
 * );
 * ```
 */

/**
 * Clerk User を Domain User にマッピング
 *
 * @param clerkUser - Clerk SDK の User オブジェクト
 * @param organizationId - 組織ID
 * @returns Domain User インスタンス
 *
 * @remarks
 * - Clerk の User ID を oidc_sub として保存
 * - メールアドレスがない場合はエラー
 * - 名前がない場合はメールアドレスから生成
 */
function mapClerkUserToDomainUser(
  clerkUser: ClerkUser,
  organizationId: string,
): User {
  const primaryEmail = clerkUser.emailAddresses.find(
    (e: { id: string }) => e.id === clerkUser.primaryEmailAddressId,
  );

  if (!primaryEmail) {
    throw new AuthenticationError(
      "メールアドレスが設定されていません。Clerk の設定を確認してください。",
    );
  }

  return new User({
    id: clerkUser.id, // Clerk User ID をそのまま使用
    organizationId,
    email: primaryEmail.emailAddress,
    name:
      `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
      primaryEmail.emailAddress.split("@")[0],
    avatarUrl: clerkUser.imageUrl,
    oidcSub: clerkUser.id,
    createdAt: new Date(clerkUser.createdAt),
    updatedAt: new Date(clerkUser.updatedAt),
  });
}

/**
 * Prisma DB にユーザーを同期
 *
 * @param user - Domain User インスタンス
 * @returns upsert された User インスタンス
 *
 * @remarks
 * - oidc_sub をキーとして upsert
 * - 既存ユーザーの場合は name と avatar_url を更新
 * - 初回ログイン時に User レコードを作成
 */
async function syncUserToDatabase(user: User): Promise<User> {
  const dbUser = await prisma.user.upsert({
    where: {
      oidc_sub: user.oidcSub ?? user.id,
    },
    update: {
      name: user.name,
      avatar_url: user.avatarUrl,
      updated_at: new Date(),
    },
    create: {
      id: user.id,
      organization_id: user.organizationId,
      email: user.email,
      name: user.name,
      avatar_url: user.avatarUrl,
      oidc_sub: user.oidcSub,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    },
  });

  return new User({
    id: dbUser.id,
    organizationId: dbUser.organization_id,
    email: dbUser.email,
    name: dbUser.name,
    avatarUrl: dbUser.avatar_url ?? undefined,
    oidcSub: dbUser.oidc_sub ?? undefined,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  });
}

/**
 * Clerk Auth Adapter Layer
 *
 * @remarks
 * **現在の実装状態: STUB (スタブ実装)**
 *
 * この Layer は Clerk SDK の実際の呼び出しをコメントアウトした状態で提供されています。
 * 実際に動作させるには、以下の手順が必要です:
 *
 * **本番実装に向けた手順:**
 *
 * 1. **Clerk SDK のインストール:**
 *    ```bash
 *    pnpm add @clerk/clerk-sdk-node @clerk/clerk-react
 *    ```
 *
 * 2. **環境変数の設定:**
 *    .env ファイルに以下を追加:
 *    ```
 *    CLERK_SECRET_KEY=sk_test_xxxxx
 *    CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
 *    DEFAULT_ORGANIZATION_ID=your-org-id
 *    ```
 *
 * 3. **Clerk クライアントの初期化:**
 *    このファイルの先頭に以下を追加:
 *    ```typescript
 *    import { clerkClient } from "@clerk/clerk-sdk-node";
 *    ```
 *
 * 4. **スタブコードのコメント解除:**
 *    各メソッド内の `// TODO: Clerk SDK 実装` コメント箇所を有効化
 *
 * 5. **セッション管理の実装:**
 *    React Router のリクエストコンテキストから Clerk セッションを取得する仕組みを追加
 *
 * **現在のスタブ動作:**
 * - getCurrentUser: 常に UnauthorizedError をスロー
 * - getSession: 常に UnauthorizedError をスロー
 * - getUserById: AuthenticationError をスロー
 * - getUserByEmail: null を返す
 * - signOut: 何もしない
 * - isAuthenticated: 常に false を返す
 *
 * @example
 * ```typescript
 * // 使用例 (Clerk SDK インストール後)
 * const program = Effect.gen(function* () {
 *   const authService = yield* AuthService;
 *   const user = yield* authService.getCurrentUser();
 *   return user;
 * });
 *
 * await Effect.runPromise(program.pipe(Effect.provide(ClerkAuthLive)));
 * ```
 */
export const ClerkAuthLive = Layer.succeed(AuthService, {
  /**
   * 現在のログインユーザーを取得
   *
   * @returns 認証済みユーザー
   * @throws UnauthorizedError - 未認証の場合
   *
   * @remarks
   * **実装手順 (Clerk SDK インストール後):**
   *
   * 1. React Router のリクエストコンテキストから Clerk userId を取得:
   *    ```typescript
   *    const { userId } = auth(); // @clerk/nextjs または同等の方法
   *    ```
   *
   * 2. Clerk API から User 情報を取得:
   *    ```typescript
   *    const clerkUser = await clerkClient.users.getUser(userId);
   *    ```
   *
   * 3. Organization ID を決定:
   *    - Clerk の Organization 機能を使用する場合:
   *      ```typescript
   *      const orgId = clerkUser.organizationMemberships[0]?.organization.id;
   *      ```
   *    - 単一 Organization の場合: 環境変数や固定値を使用
   *
   * 4. Domain User にマッピングして DB に同期
   *
   * **現在のスタブ動作:** 常に UnauthorizedError をスロー
   */
  getCurrentUser: () =>
    Effect.gen(function* () {
      // TODO: Clerk SDK 実装
      // ========================================
      // 以下は実装例 (Clerk SDK インストール後に有効化)
      // ========================================
      //
      // // 1. Clerk セッションから userId を取得
      // const { userId } = auth(); // または getAuth(request) など
      // if (!userId) {
      //   return yield* Effect.fail(
      //     new UnauthorizedError("認証が必要です")
      //   );
      // }
      //
      // // 2. Clerk API から User 情報を取得
      // let clerkUser: ClerkUser;
      // try {
      //   clerkUser = await clerkClient.users.getUser(userId);
      // } catch (error) {
      //   return yield* Effect.fail(
      //     new AuthenticationError(
      //       `Clerk APIエラー: ${error instanceof Error ? error.message : "不明なエラー"}`
      //     )
      //   );
      // }
      //
      // // 3. Organization ID を決定
      // const organizationId =
      //   clerkUser.organizationMemberships[0]?.organization.id ??
      //   process.env.DEFAULT_ORGANIZATION_ID ??
      //   "default-org";
      //
      // // 4. Domain User にマッピング
      // const user = mapClerkUserToDomainUser(clerkUser, organizationId);
      //
      // // 5. DB に同期
      // try {
      //   const syncedUser = await syncUserToDatabase(user);
      //   return syncedUser;
      // } catch (error) {
      //   return yield* Effect.fail(
      //     new AuthenticationError(
      //       `データベースエラー: ${error instanceof Error ? error.message : "不明なエラー"}`
      //     )
      //   );
      // }

      // STUB: 常に UnauthorizedError をスロー
      return yield* Effect.fail(
        new UnauthorizedError("認証が必要です (Clerk SDK 未実装)"),
      );
    }),

  /**
   * セッション情報を取得
   *
   * @returns セッション情報
   * @throws UnauthorizedError - 未認証の場合
   *
   * @remarks
   * **実装手順 (Clerk SDK インストール後):**
   *
   * 1. Clerk セッションを取得:
   *    ```typescript
   *    const { sessionId, userId, orgId } = auth();
   *    const session = await clerkClient.sessions.getSession(sessionId);
   *    ```
   *
   * 2. SessionInfo にマッピング:
   *    ```typescript
   *    return {
   *      userId,
   *      organizationId: orgId ?? "default-org",
   *      sessionId,
   *      expiresAt: new Date(session.expireAt),
   *    };
   *    ```
   *
   * **現在のスタブ動作:** 常に UnauthorizedError をスロー
   */
  getSession: () =>
    Effect.gen(function* () {
      // TODO: Clerk SDK 実装
      // ========================================
      // 以下は実装例
      // ========================================
      //
      // const { sessionId, userId, orgId } = auth();
      // if (!sessionId || !userId) {
      //   return yield* Effect.fail(
      //     new UnauthorizedError("セッションが見つかりません")
      //   );
      // }
      //
      // try {
      //   const session = await clerkClient.sessions.getSession(sessionId);
      //   return {
      //     userId,
      //     organizationId: orgId ?? process.env.DEFAULT_ORGANIZATION_ID ?? "default-org",
      //     sessionId,
      //     expiresAt: new Date(session.expireAt),
      //   } satisfies SessionInfo;
      // } catch (error) {
      //   return yield* Effect.fail(
      //     new AuthenticationError(
      //       `セッション取得エラー: ${error instanceof Error ? error.message : "不明なエラー"}`
      //     )
      //   );
      // }

      // STUB: 常に UnauthorizedError をスロー
      return yield* Effect.fail(
        new UnauthorizedError("セッションが見つかりません (Clerk SDK 未実装)"),
      );
    }),

  /**
   * ユーザーIDからユーザーを取得
   *
   * @param userId - ユーザーID (Clerk User ID)
   * @returns ユーザー情報
   * @throws AuthenticationError - ユーザーが見つからない場合
   *
   * @remarks
   * **実装手順:**
   *
   * 1. DB から oidc_sub でユーザーを検索:
   *    ```typescript
   *    const dbUser = await prisma.user.findUnique({
   *      where: { oidc_sub: userId }
   *    });
   *    ```
   *
   * 2. 見つからない場合は Clerk API から取得して同期:
   *    ```typescript
   *    const clerkUser = await clerkClient.users.getUser(userId);
   *    const user = mapClerkUserToDomainUser(clerkUser, orgId);
   *    await syncUserToDatabase(user);
   *    ```
   *
   * **現在のスタブ動作:** AuthenticationError をスロー
   */
  getUserById: (userId: string) =>
    Effect.gen(function* () {
      // TODO: Clerk SDK 実装
      // ========================================
      // 以下は実装例
      // ========================================
      //
      // // 1. DB から検索
      // try {
      //   const dbUser = await prisma.user.findUnique({
      //     where: { oidc_sub: userId },
      //   });
      //
      //   if (dbUser) {
      //     return new User({
      //       id: dbUser.id,
      //       organizationId: dbUser.organization_id,
      //       email: dbUser.email,
      //       name: dbUser.name,
      //       avatarUrl: dbUser.avatar_url ?? undefined,
      //       oidcSub: dbUser.oidc_sub ?? undefined,
      //       createdAt: dbUser.created_at,
      //       updatedAt: dbUser.updated_at,
      //     });
      //   }
      // } catch (error) {
      //   // DB エラーは無視して Clerk API にフォールバック
      // }
      //
      // // 2. Clerk API から取得
      // try {
      //   const clerkUser = await clerkClient.users.getUser(userId);
      //   const organizationId =
      //     clerkUser.organizationMemberships[0]?.organization.id ??
      //     process.env.DEFAULT_ORGANIZATION_ID ??
      //     "default-org";
      //   const user = mapClerkUserToDomainUser(clerkUser, organizationId);
      //   return await syncUserToDatabase(user);
      // } catch (error) {
      //   return yield* Effect.fail(
      //     new AuthenticationError(
      //       `ユーザーが見つかりません: ${userId}`
      //     )
      //   );
      // }

      // STUB: 常に AuthenticationError をスロー
      return yield* Effect.fail(
        new AuthenticationError(
          `ユーザーが見つかりません: ${userId} (Clerk SDK 未実装)`,
        ),
      );
    }),

  /**
   * メールアドレスからユーザーを取得
   *
   * @param emailAddress - メールアドレス
   * @returns ユーザー情報 (見つからない場合は null)
   *
   * @remarks
   * **実装手順:**
   *
   * 1. DB から email でユーザーを検索:
   *    ```typescript
   *    const dbUser = await prisma.user.findUnique({
   *      where: { email: emailAddress }
   *    });
   *    ```
   *
   * 2. 見つからない場合は Clerk API から検索:
   *    ```typescript
   *    const users = await clerkClient.users.getUserList({
   *      emailAddress: [emailAddress]
   *    });
   *    ```
   *
   * **現在のスタブ動作:** 常に null を返す
   */
  getUserByEmail: (emailAddress: string) =>
    Effect.gen(function* () {
      // TODO: Clerk SDK 実装
      // ========================================
      // 以下は実装例
      // ========================================
      //
      // // 1. DB から検索
      // try {
      //   const dbUser = await prisma.user.findUnique({
      //     where: { email },
      //   });
      //
      //   if (dbUser) {
      //     return new User({
      //       id: dbUser.id,
      //       organizationId: dbUser.organization_id,
      //       email: dbUser.email,
      //       name: dbUser.name,
      //       avatarUrl: dbUser.avatar_url ?? undefined,
      //       oidcSub: dbUser.oidc_sub ?? undefined,
      //       createdAt: dbUser.created_at,
      //       updatedAt: dbUser.updated_at,
      //     });
      //   }
      // } catch (error) {
      //   // DB エラーは無視して Clerk API にフォールバック
      // }
      //
      // // 2. Clerk API から検索
      // try {
      //   const users = await clerkClient.users.getUserList({
      //     emailAddress: [email],
      //   });
      //
      //   if (users.data.length === 0) {
      //     return null;
      //   }
      //
      //   const clerkUser = users.data[0];
      //   const organizationId =
      //     clerkUser.organizationMemberships[0]?.organization.id ??
      //     process.env.DEFAULT_ORGANIZATION_ID ??
      //     "default-org";
      //   const user = mapClerkUserToDomainUser(clerkUser, organizationId);
      //   return await syncUserToDatabase(user);
      // } catch (error) {
      //   return yield* Effect.fail(
      //     new AuthenticationError(
      //       `ユーザー検索エラー: ${error instanceof Error ? error.message : "不明なエラー"}`
      //     )
      //   );
      // }

      // STUB: 常に null を返す
      return null;
    }),

  /**
   * ログアウト
   *
   * @returns void
   *
   * @remarks
   * **実装手順:**
   *
   * Clerk の場合、サーバー側でのログアウトは通常不要です。
   * クライアント側で `clerk.signOut()` を呼び出すだけで完結します。
   *
   * サーバー側で明示的にセッションを無効化したい場合:
   * ```typescript
   * const { sessionId } = auth();
   * await clerkClient.sessions.revokeSession(sessionId);
   * ```
   *
   * **現在のスタブ動作:** 何もしない
   */
  signOut: () =>
    Effect.gen(function* () {
      // TODO: Clerk SDK 実装
      // ========================================
      // Clerk の場合、サーバー側でのログアウトは不要
      // クライアント側で clerk.signOut() を呼び出す
      // ========================================
      //
      // // サーバー側でセッションを無効化する場合:
      // const { sessionId } = auth();
      // if (sessionId) {
      //   try {
      //     await clerkClient.sessions.revokeSession(sessionId);
      //   } catch (error) {
      //     // エラーは無視（既に無効な可能性）
      //   }
      // }

      // STUB: 何もしない
      return undefined;
    }),

  /**
   * 認証済みかチェック
   *
   * @returns 認証済みの場合 true
   *
   * @remarks
   * **実装手順:**
   *
   * ```typescript
   * const { userId } = auth();
   * return !!userId;
   * ```
   *
   * **現在のスタブ動作:** 常に false を返す
   */
  isAuthenticated: () =>
    Effect.gen(function* () {
      // TODO: Clerk SDK 実装
      // ========================================
      // 以下は実装例
      // ========================================
      //
      // const { userId } = auth();
      // return !!userId;

      // STUB: 常に false を返す
      return false;
    }),
});
