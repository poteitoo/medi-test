import { useSearchParams } from "react-router";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";

/**
 * Login Page - Meta
 *
 * React Router v7 のメタデータ定義
 */
export function meta() {
  return [
    { title: "ログイン - medi-test" },
    { name: "description", content: "medi-testテスト管理システムにログイン" },
  ];
}

/**
 * Login Page
 *
 * Clerk OAuth 2.0 / OIDC 認証を使用したログイン画面
 *
 * @remarks
 * **実装状態: STUB (スタブ実装)**
 *
 * 現在は Clerk SDK 未インストールのため、プレースホルダー UI を表示しています。
 *
 * **本番実装に向けた手順:**
 *
 * 1. **Clerk SDK のインストール:**
 *    ```bash
 *    pnpm add @clerk/clerk-react
 *    ```
 *
 * 2. **環境変数の設定:**
 *    .env ファイルに以下を追加:
 *    ```
 *    CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
 *    ```
 *
 * 3. **ClerkProvider の設定 (app/root.tsx):**
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
 * 4. **このファイルを更新:**
 *    以下のコメントアウトされたコードを有効化:
 *    ```tsx
 *    import { SignIn } from "@clerk/clerk-react";
 *
 *    <SignIn
 *      routing="path"
 *      path="/login"
 *      signUpUrl="/signup"
 *      forceRedirectUrl={redirectUrl}
 *      appearance={{
 *        elements: {
 *          rootBox: "mx-auto",
 *          card: "shadow-lg",
 *        },
 *      }}
 *    />
 *    ```
 *
 * **機能:**
 * - Clerk の SignIn コンポーネントを使用
 * - リダイレクト URL をクエリパラメータから取得
 * - ログイン後は元のページに戻る
 * - Shadcn/ui スタイルに統一
 *
 * @example
 * ```typescript
 * // 使用例: 認証が必要なページから自動リダイレクト
 * // /dashboard にアクセス → 未認証 → /login?redirect=/dashboard
 * // ログイン成功 → /dashboard に自動リダイレクト
 * ```
 */
export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">medi-test</h1>
          <p className="mt-2 text-sm text-gray-600">テスト管理システム</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ログイン</CardTitle>
            <CardDescription>Clerk 認証でログインしてください</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* TODO: Clerk SDK インストール後に有効化 */}
              {/* ========================================
              <SignIn
                routing="path"
                path="/login"
                signUpUrl="/signup"
                forceRedirectUrl={redirectUrl}
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "shadow-lg",
                  },
                }}
              />
              ======================================== */}

              {/* STUB: プレースホルダー UI */}
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8">
                  <div className="mb-4 text-4xl">🔐</div>
                  <h3 className="mb-2 font-semibold text-gray-900">
                    Clerk 認証セットアップが必要です
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    以下の手順に従って Clerk SDK をセットアップしてください:
                  </p>
                  <ol className="mb-6 space-y-2 text-left text-sm text-gray-700">
                    <li>
                      1.{" "}
                      <code className="rounded bg-gray-100 px-1 py-0.5">
                        pnpm add @clerk/clerk-react
                      </code>
                    </li>
                    <li>
                      2. 環境変数に{" "}
                      <code className="rounded bg-gray-100 px-1 py-0.5">
                        CLERK_PUBLISHABLE_KEY
                      </code>{" "}
                      を設定
                    </li>
                    <li>
                      3.{" "}
                      <code className="rounded bg-gray-100 px-1 py-0.5">
                        app/root.tsx
                      </code>{" "}
                      に ClerkProvider を追加
                    </li>
                    <li>4. このファイルのコメントを解除</li>
                  </ol>
                  <Button disabled variant="outline" className="w-full">
                    ログイン (Clerk SDK 未インストール)
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  リダイレクト先: {redirectUrl}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-500">
          OAuth 2.0 / OIDC による安全な認証
        </p>
      </div>
    </div>
  );
}
