import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "react-router";
import {
  Form as FormProvider,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { loginSchema, type LoginFormData } from "~/lib/schemas/auth";

interface LoginFormProps {
  errors?: {
    username?: string;
    password?: string;
  };
}

export function LoginForm({ errors }: LoginFormProps) {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <FormProvider {...form}>
      <Form method="post" className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ユーザー名</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage>{errors?.username}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage>{errors?.password}</FormMessage>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          ログイン
        </Button>
      </Form>
    </FormProvider>
  );
}
