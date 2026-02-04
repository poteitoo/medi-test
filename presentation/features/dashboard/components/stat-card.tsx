import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  gradientClass?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  gradientClass,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-lg hover:shadow-xl transition-shadow",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center",
            gradientClass || "bg-primary/10",
          )}
        >
          <Icon className={cn("h-5 w-5", gradientClass ? "text-white" : "text-primary")} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <p
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600",
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </p>
            <p className="text-xs text-muted-foreground">前週比</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
