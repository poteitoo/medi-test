import { useState } from "react";
import { Check, ChevronsUpDown, FolderOpen } from "lucide-react";
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
 * プロジェクト選択コンポーネントのProps
 */
type ProjectSelectorProps = {
  /**
   * 選択可能なプロジェクト一覧
   */
  projects: Array<{
    id: string;
    name: string;
    slug: string;
  }>;

  /**
   * 現在選択されているプロジェクトID
   */
  selectedProjectId?: string;

  /**
   * プロジェクトが選択されたときのコールバック
   */
  onProjectSelect: (projectId: string) => void;

  /**
   * コンポーネントの無効化状態
   */
  disabled?: boolean;

  /**
   * プレースホルダーテキスト
   */
  placeholder?: string;
};

/**
 * プロジェクト選択コンポーネント
 *
 * ドロップダウンでプロジェクトを選択できるUI
 */
export function ProjectSelector({
  projects,
  selectedProjectId,
  onProjectSelect,
  disabled = false,
  placeholder = "プロジェクトを選択",
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-[300px] justify-between"
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">
              {selectedProject ? selectedProject.name : placeholder}
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
            <CommandGroup>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={() => {
                    onProjectSelect(project.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProjectId === project.id
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
