import { z } from "zod";

export const consultationContentSchema = z.object({
  content: z.string().min(1, "診察内容を入力してください"),
});

export type ConsultationContentFormData = z.infer<
  typeof consultationContentSchema
>;
