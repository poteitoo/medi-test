import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "ユーザー名を入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
