import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TestCaseContent,
  TestCasePriority,
  TestCasePriorityLabels,
  TestStep,
} from "../../domain/models/test-case-content";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Plus, Trash, ChevronUp, ChevronDown, Save } from "lucide-react";
import { cn } from "~/lib/utils";

// Zodスキーマ定義
const testStepSchema = z.object({
  action: z.string().min(1, "操作を入力してください"),
  expectedOutcome: z.string().min(1, "期待される結果を入力してください"),
});

const testCaseContentSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  steps: z.array(testStepSchema).min(1, "テスト手順を1つ以上追加してください"),
  expectedResult: z.string().min(1, "期待結果を入力してください"),
  tags: z.string(), // カンマ区切り文字列
  priority: z.nativeEnum(TestCasePriority),
  environment: z.string().min(1, "環境を入力してください"),
});

type TestCaseContentFormData = z.infer<typeof testCaseContentSchema>;

export type TestCaseEditorProps = {
  readonly initialContent?: TestCaseContent;
  readonly onSave: (content: TestCaseContent) => void;
  readonly disabled?: boolean;
};

/**
 * テストケース内容編集コンポーネント
 *
 * テストケースのタイトル、手順、期待結果、タグ、優先度などを編集します。
 *
 * @example
 * ```tsx
 * <TestCaseEditor
 *   initialContent={content}
 *   onSave={(content) => console.log(content)}
 *   disabled={false}
 * />
 * ```
 */
export function TestCaseEditor({
  initialContent,
  onSave,
  disabled = false,
}: TestCaseEditorProps) {
  const form = useForm<TestCaseContentFormData>({
    resolver: zodResolver(testCaseContentSchema),
    defaultValues: {
      title: "",
      steps: [{ action: "", expectedOutcome: "" }],
      expectedResult: "",
      tags: initialContent?.tags.join(", ") ?? "",
      priority: initialContent?.priority ?? TestCasePriority.MEDIUM,
      environment: initialContent?.environment ?? "staging",
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const handleSubmit = (data: TestCaseContentFormData) => {
    // タグを配列に変換
    const tagsArray = data.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // TestStepオブジェクトに変換
    const steps = data.steps.map(
      (step, index) =>
        new TestStep({
          stepNumber: index + 1,
          action: step.action,
          expectedOutcome: step.expectedOutcome,
        }),
    );

    // TestCaseContentオブジェクトを作成
    const content = new TestCaseContent({
      steps,
      expectedResult: data.expectedResult,
      tags: tagsArray,
      priority: data.priority,
      environment: data.environment,
    });

    onSave(content);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>テストケース編集</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* タイトル */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タイトル</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="テストケースのタイトルを入力..."
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* テスト手順 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <FormLabel>テスト手順</FormLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ action: "", expectedOutcome: "" })}
                  disabled={disabled}
                >
                  <Plus className="mr-2 size-4" />
                  手順を追加
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border-dashed">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            ステップ {index + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            {/* 上へ移動 */}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => move(index, index - 1)}
                              disabled={disabled || index === 0}
                            >
                              <ChevronUp className="size-4" />
                            </Button>
                            {/* 下へ移動 */}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => move(index, index + 1)}
                              disabled={disabled || index === fields.length - 1}
                            >
                              <ChevronDown className="size-4" />
                            </Button>
                            {/* 削除 */}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => remove(index)}
                              disabled={disabled || fields.length === 1}
                            >
                              <Trash className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name={`steps.${index}.action`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>操作</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="実行する操作を入力..."
                                  disabled={disabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`steps.${index}.expectedOutcome`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>期待される結果</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="期待される結果を入力..."
                                  disabled={disabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* 期待結果 */}
            <FormField
              control={form.control}
              name="expectedResult"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最終的な期待結果</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="全ての手順を実行した後に得られるべき最終的な結果を入力..."
                      rows={4}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* タグ */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タグ</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="タグをカンマ区切りで入力（例: ログイン, 認証, UI）"
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* 優先度と環境 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>優先度</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={disabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="優先度を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TestCasePriorityLabels).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>環境</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="staging, production など"
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <Button type="submit" disabled={disabled}>
                <Save className="mr-2 size-4" />
                保存
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
