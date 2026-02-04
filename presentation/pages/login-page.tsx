import type { ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import z from "zod";
import { LoginForm } from "~/features/auth/login-form";
import { loginSchema } from "~/lib/schemas/auth";

export function meta() {
  return [
    { title: "ログイン - Theta" },
    { name: "description", content: "Thetaにログインする" },
  ];
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  // サーバー側バリデーション
  const validation = loginSchema.safeParse({ username, password });
  if (!validation.success) {
    const errors = z.treeifyError(validation.error).properties;
    return data(
      {
        errors: {
          username: errors?.username?.errors?.[0],
          password: errors?.password?.errors?.[0],
        },
      },
      { status: 400 },
    );
  }

  // コンソールに出力（要件通り）
  console.log("Login attempt:", {
    username,
    password,
    timestamp: new Date().toISOString(),
  });

  // ホームにリダイレクト
  throw redirect("/");
}

export default function LoginPage({
  actionData,
}: {
  actionData?: {
    errors?: {
      username?: string;
      password?: string;
    };
  };
}) {
  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">ログイン</h1>
          <p className="text-muted-foreground mt-2">
            アカウント情報を入力してください
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <LoginForm errors={actionData?.errors} />
        </div>
      </div>
    </div>
  );
}
