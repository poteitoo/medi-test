import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { TextEditor } from "~/features/text-editor";
import { TagInput } from "./components/tag-input";
import { FolderSelect } from "./components/folder-select";
import { useScenarioForm } from "./hooks/use-scenario-form";
import { MOCK_TAGS, MOCK_FOLDERS } from "~/lib/mock-data/scenario-mock";

interface ScenarioCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScenarioCreationDialog({
  open,
  onOpenChange,
}: ScenarioCreationDialogProps) {
  const { form, handleSubmit, isSubmitting } = useScenarioForm(() => {
    // 成功時にダイアログを閉じる
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>シナリオを作成</DialogTitle>
          <DialogDescription>
            テストシナリオの詳細を入力してください
          </DialogDescription>
        </DialogHeader>

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
                  <FormLabel>
                    タイトル <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="シナリオタイトルを入力してください"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 説明（TextEditor） */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明（任意）</FormLabel>
                  <FormControl>
                    <TextEditor
                      content={field.value}
                      onChange={field.onChange}
                      placeholder="シナリオの詳細を入力してください..."
                      showToolbar={true}
                      enableVoiceInput={false}
                    />
                  </FormControl>
                  <FormDescription>Markdown形式で入力できます</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* タグ */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タグ（最大5個）</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      availableTags={MOCK_TAGS}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* フォルダー */}
            <FormField
              control={form.control}
              name="folderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>フォルダー（任意）</FormLabel>
                  <FormControl>
                    <FolderSelect
                      value={field.value}
                      onChange={field.onChange}
                      folders={MOCK_FOLDERS}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* フォームエラー */}
            {form.formState.errors.root && (
              <div className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  キャンセル
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "作成中..." : "作成"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
