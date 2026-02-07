import { SignIn } from "@clerk/clerk-react";
import { useSearchParams } from "react-router";

export function meta() {
  return [
    { title: "ログイン - medi-test" },
    { name: "description", content: "medi-testにログインする" },
  ];
}

/**
 * ログイン画面
 *
 * Clerk の SignIn コンポーネントを使用した認証画面
 */
export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">medi-test</h1>
          <p className="mt-2 text-sm text-gray-600">
            テスト管理システムにログイン
          </p>
        </div>

        <div className="flex justify-center">
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
        </div>
      </div>
    </div>
  );
}
