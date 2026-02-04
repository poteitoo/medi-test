import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import type { TestRunStatus } from "~/lib/schemas/test-run";

interface TestRunStatusBadgeProps {
  status: TestRunStatus;
  className?: string;
}

const statusConfig: Record<
  TestRunStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string }
> = {
  planned: {
    label: "計画中",
    variant: "secondary",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  in_progress: {
    label: "実行中",
    variant: "default",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 animate-pulse",
  },
  completed: {
    label: "完了",
    variant: "outline",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700",
  },
  failed: {
    label: "失敗",
    variant: "destructive",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
};

export function TestRunStatusBadge({ status, className }: TestRunStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {status === "in_progress" && (
        <span className="mr-1 inline-flex h-2 w-2">
          <span className="absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
      )}
      {config.label}
    </Badge>
  );
}
