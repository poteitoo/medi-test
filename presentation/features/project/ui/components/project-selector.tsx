import { useState } from "react";
import { Building, Check, ChevronsUpDown, FolderKanban } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

/**
 * 組織データ型
 */
type OrganizationData = {
  id: string;
  name: string;
  slug: string;
  projects: ProjectData[];
};

/**
 * プロジェクトデータ型
 */
type ProjectData = {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
};

/**
 * プロジェクト選択コンポーネントのProps
 */
type ProjectSelectorProps = {
  /**
   * 組織とプロジェクト一覧
   */
  organizations: OrganizationData[];

  /**
   * 現在選択されているプロジェクトID
   */
  currentProjectId?: string;

  /**
   * プロジェクトが選択されたときのコールバック
   */
  onSelectProject: (projectId: string) => void;

  /**
   * コンポーネントの無効化状態
   */
  disabled?: boolean;

  /**
   * プレースホルダーテキスト
   */
  placeholder?: string;

  /**
   * ローディング状態
   */
  loading?: boolean;
};

/**
 * プロジェクト選択コンポーネント
 *
 * 組織ごとにグループ化されたプロジェクトを選択できるドロップダウンUI
 * shadcn/ui のCommandコンポーネントを使用
 */
export function ProjectSelector({
  organizations,
  currentProjectId,
  onSelectProject,
  disabled = false,
  placeholder = "プロジェクトを選択",
  loading = false,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);

  // 現在選択されているプロジェクトを検索
  const selectedProject = organizations
    .flatMap((org) => org.projects)
    .find((project) => project.id === currentProjectId);

  // 組織情報を取得
  const selectedOrganization = organizations.find((org) =>
    org.projects.some((p) => p.id === currentProjectId),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className="w-[300px] justify-between"
        >
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">
              {loading
                ? "読み込み中..."
                : selectedProject
                  ? selectedProject.name
                  : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="プロジェクトを検索..." />
          <CommandList>
            <CommandEmpty>プロジェクトが見つかりません</CommandEmpty>
            {organizations.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                プロジェクトがありません
              </div>
            ) : (
              organizations.map((organization) => (
                <CommandGroup
                  key={organization.id}
                  heading={
                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3" />
                      <span>{organization.name}</span>
                    </div>
                  }
                >
                  {organization.projects.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={`${organization.name} ${project.name} ${project.slug}`}
                      onSelect={() => {
                        onSelectProject(project.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          currentProjectId === project.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {project.slug}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
