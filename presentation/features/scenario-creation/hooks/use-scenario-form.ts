import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { scenarioSchema } from "~/lib/schemas/scenario";
import { createScenarioMock } from "~/lib/mock-data/scenario-mock";
import type { ScenarioFormData } from "~/lib/schemas/scenario";

interface UseScenarioFormReturn {
  form: ReturnType<typeof useForm<ScenarioFormData>>;
  handleSubmit: (data: ScenarioFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function useScenarioForm(
  onSuccess?: () => void,
): UseScenarioFormReturn {
  const form = useForm<ScenarioFormData>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      folderId: undefined,
    },
  });

  const handleSubmit = async (data: ScenarioFormData) => {
    try {
      await createScenarioMock(data);

      // TODO: Toast 通知（成功）
      console.log("シナリオを作成しました");

      // フォームをリセット
      form.reset();

      // 成功コールバック
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // TODO: Toast 通知（エラー）
      console.error("シナリオの作成に失敗しました:", error);

      // エラーをフォームに表示
      form.setError("root", {
        type: "manual",
        message:
          error instanceof Error
            ? error.message
            : "シナリオの作成に失敗しました",
      });
    }
  };

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
}
