import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

/**
 * ステータスバッジのバリアント定義
 */
const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      /**
       * バッジの表示スタイル
       */
      variant: {
        default: "bg-gray-100 text-gray-800",
        primary: "bg-blue-100 text-blue-800",
        secondary: "bg-purple-100 text-purple-800",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        danger: "bg-red-100 text-red-800",
        info: "bg-cyan-100 text-cyan-800",
      },
      /**
       * バッジのサイズ
       */
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

/**
 * ステータスバッジのProps型
 */
export type StatusBadgeProps = {
  /**
   * バッジに表示するテキスト
   */
  children: React.ReactNode;

  /**
   * カスタムクラス名
   */
  className?: string;

  /**
   * インジケーターの表示
   */
  showIndicator?: boolean;
} & VariantProps<typeof statusBadgeVariants>;

/**
 * ステータスバッジコンポーネント
 *
 * ステータスや状態を視覚的に表現するバッジ
 *
 * @example
 * <StatusBadge variant="success">承認済み</StatusBadge>
 * <StatusBadge variant="warning" showIndicator>レビュー中</StatusBadge>
 * <StatusBadge variant="danger">却下</StatusBadge>
 */
export function StatusBadge({
  children,
  className,
  variant = "default",
  size = "md",
  showIndicator = false,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ variant, size }), className)}
      role="status"
    >
      {showIndicator && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-gray-600": variant === "default",
            "bg-blue-600": variant === "primary",
            "bg-purple-600": variant === "secondary",
            "bg-green-600": variant === "success",
            "bg-yellow-600": variant === "warning",
            "bg-red-600": variant === "danger",
            "bg-cyan-600": variant === "info",
          })}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/**
 * テストケースのステータスバッジ
 *
 * RevisionStatusに対応したプリセット
 */
export function TestCaseStatusBadge({
  status,
  className,
  size,
}: {
  status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "DEPRECATED";
  className?: string;
  size?: StatusBadgeProps["size"];
}) {
  const statusConfig: Record<
    typeof status,
    { variant: StatusBadgeProps["variant"]; label: string }
  > = {
    DRAFT: { variant: "default", label: "下書き" },
    IN_REVIEW: { variant: "warning", label: "レビュー中" },
    APPROVED: { variant: "success", label: "承認済み" },
    DEPRECATED: { variant: "secondary", label: "非推奨" },
  };

  const config = statusConfig[status];

  return (
    <StatusBadge
      variant={config.variant}
      size={size}
      className={className}
      showIndicator
    >
      {config.label}
    </StatusBadge>
  );
}

/**
 * リリースのステータスバッジ
 */
export function ReleaseStatusBadge({
  status,
  className,
}: {
  status: "PLANNING" | "IN_PROGRESS" | "TESTING" | "COMPLETED" | "CANCELLED";
  className?: string;
}) {
  const statusConfig: Record<
    typeof status,
    { variant: StatusBadgeProps["variant"]; label: string }
  > = {
    PLANNING: { variant: "default", label: "計画中" },
    IN_PROGRESS: { variant: "primary", label: "進行中" },
    TESTING: { variant: "warning", label: "テスト中" },
    COMPLETED: { variant: "success", label: "完了" },
    CANCELLED: { variant: "danger", label: "キャンセル" },
  };

  const config = statusConfig[status];

  return (
    <StatusBadge variant={config.variant} className={className} showIndicator>
      {config.label}
    </StatusBadge>
  );
}

/**
 * テスト実行結果のステータスバッジ
 */
export function TestResultStatusBadge({
  status,
  className,
}: {
  status: "PASSED" | "FAILED" | "BLOCKED" | "SKIPPED" | "IN_PROGRESS";
  className?: string;
}) {
  const statusConfig: Record<
    typeof status,
    { variant: StatusBadgeProps["variant"]; label: string }
  > = {
    PASSED: { variant: "success", label: "合格" },
    FAILED: { variant: "danger", label: "不合格" },
    BLOCKED: { variant: "warning", label: "ブロック" },
    SKIPPED: { variant: "secondary", label: "スキップ" },
    IN_PROGRESS: { variant: "primary", label: "実行中" },
  };

  const config = statusConfig[status];

  return (
    <StatusBadge variant={config.variant} className={className} showIndicator>
      {config.label}
    </StatusBadge>
  );
}
