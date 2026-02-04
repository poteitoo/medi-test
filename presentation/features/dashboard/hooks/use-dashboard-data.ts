import { useState, useEffect } from "react";
import { getMockDashboardData } from "../types/dashboard";
import type { DashboardData } from "../types/dashboard";

interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * ダッシュボードデータを取得するフック
 *
 * Phase 1: モックデータを返す
 * Phase 2: React Router loader または API 呼び出しに置換
 */
export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = () => {
    setIsLoading(true);
    setError(null);

    // API 呼び出しをシミュレート
    const timer = setTimeout(() => {
      try {
        const mockData = getMockDashboardData();
        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  };

  useEffect(() => {
    const cleanup = fetchData();
    return cleanup;
  }, []);

  const refresh = () => {
    fetchData();
  };

  return { data, isLoading, error, refresh };
}
