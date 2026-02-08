import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
  type PaginationState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

/**
 * データテーブルコンポーネントのProps
 */
type DataTableProps<TData, TValue> = {
  /**
   * テーブルの列定義
   */
  columns: ColumnDef<TData, TValue>[];

  /**
   * テーブルデータ
   */
  data: TData[];

  /**
   * ページネーション情報
   */
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };

  /**
   * ページネーション変更時のコールバック
   */
  onPaginationChange?: (pagination: PaginationState) => void;

  /**
   * サーバーサイドページネーションを使用するか
   */
  manualPagination?: boolean;

  /**
   * 総ページ数（サーバーサイドページネーションの場合）
   */
  pageCount?: number;

  /**
   * ローディング状態
   */
  isLoading?: boolean;

  /**
   * データが空の場合のメッセージ
   */
  emptyMessage?: string;
};

/**
 * データテーブルコンポーネント
 *
 * TanStack Tableを使用したソート・ページネーション機能付きテーブル
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  pagination: initialPagination,
  onPaginationChange,
  manualPagination = false,
  pageCount,
  isLoading = false,
  emptyMessage = "データがありません",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination ?? {
      pageIndex: 0,
      pageSize: 20,
    },
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater;
      setPagination(newPagination);
      onPaginationChange?.(newPagination);
    },
    state: {
      sorting,
      pagination,
    },
    manualPagination,
    pageCount,
  });

  return (
    <div className="space-y-4">
      {/* テーブル */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  読み込み中...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      {!isLoading && table.getPageCount() > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.previousPage();
                }}
                aria-disabled={!table.getCanPreviousPage()}
              />
            </PaginationItem>

            {Array.from({ length: table.getPageCount() }, (_, i) => i).map(
              (pageIndex) => (
                <PaginationItem key={pageIndex}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      table.setPageIndex(pageIndex);
                    }}
                    isActive={
                      pageIndex === table.getState().pagination.pageIndex
                    }
                  >
                    {pageIndex + 1}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.nextPage();
                }}
                aria-disabled={!table.getCanNextPage()}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

/**
 * ソート可能なヘッダーコンポーネント
 *
 * @example
 * const columns: ColumnDef<User>[] = [
 *   {
 *     accessorKey: "name",
 *     header: ({ column }) => (
 *       <SortableHeader column={column} title="名前" />
 *     ),
 *   },
 * ];
 */
export function SortableHeader({
  column,
  title,
}: {
  column: { toggleSorting: (descending?: boolean) => void };
  title: string;
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting()}
      className="-ml-3 h-8 data-[state=open]:bg-accent"
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}
