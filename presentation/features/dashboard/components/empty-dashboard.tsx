import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "~/components/ui/empty";
import { PlusCircle } from "lucide-react";

export function EmptyDashboard() {
  return (
    <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>テスト実行がまだありません</EmptyTitle>
          <EmptyDescription>
            新しいテストランを作成して、QAプロセスを開始しましょう
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            新しいテストランを作成
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
