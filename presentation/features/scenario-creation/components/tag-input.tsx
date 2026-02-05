import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Plus, X } from "lucide-react";
import { cn } from "~/lib/utils";
import type { Tag } from "../types/scenario-types";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  availableTags: Tag[];
  maxTags?: number;
}

export function TagInput({
  value,
  onChange,
  availableTags,
  maxTags = 5,
}: TagInputProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // 検索値でタグをフィルタリング
  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchValue.toLowerCase()),
  );

  // カスタムタグオプションを表示するかどうか
  const showCustomOption =
    searchValue.length > 0 &&
    !filteredTags.some(
      (tag) => tag.name.toLowerCase() === searchValue.toLowerCase(),
    ) &&
    !value.includes(searchValue);

  // タグを追加
  const addTag = (tagId: string) => {
    if (value.length >= maxTags) {
      return;
    }

    if (!value.includes(tagId)) {
      onChange([...value, tagId]);
    }

    setSearchValue("");
    // ポップオーバーは開いたままにする（複数選択可能）
  };

  // タグを削除
  const removeTag = (tagId: string) => {
    onChange(value.filter((id) => id !== tagId));
  };

  // タグ名を取得（IDまたは名前から）
  const getTagName = (tagId: string): string => {
    const tag = availableTags.find((t) => t.id === tagId);
    return tag ? tag.name : tagId;
  };

  // タグの色を取得
  const getTagColor = (
    tagId: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    const tag = availableTags.find((t) => t.id === tagId);
    const color = tag?.color || "secondary";
    // "primary" は Badge でサポートされていないため "default" にマップ
    return color === "primary" ? "default" : color;
  };

  const isMaxTags = value.length >= maxTags;

  return (
    <div className="space-y-2">
      {/* 選択済みタグの表示 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tagId) => (
            <Badge
              key={tagId}
              variant={getTagColor(tagId)}
              className="gap-1 pr-1"
            >
              {getTagName(tagId)}
              <button
                type="button"
                onClick={() => removeTag(tagId)}
                className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* タグ入力 */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start",
              isMaxTags && "opacity-50 cursor-not-allowed",
            )}
            disabled={isMaxTags}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isMaxTags ? `タグは最大${maxTags}個まで` : "タグを追加..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="タグを検索..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>タグが見つかりません</CommandEmpty>

              {/* 推奨タグ */}
              {filteredTags.length > 0 && (
                <CommandGroup heading="推奨タグ">
                  {filteredTags.map((tag) => {
                    const color = tag.color || "secondary";
                    const badgeVariant =
                      color === "primary" ? "default" : color;
                    return (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => addTag(tag.id)}
                        disabled={value.includes(tag.id)}
                      >
                        <Badge variant={badgeVariant} className="mr-2">
                          {tag.name}
                        </Badge>
                        {value.includes(tag.id) && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            選択済み
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {/* カスタムタグ */}
              {showCustomOption && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="カスタム">
                    <CommandItem onSelect={() => addTag(searchValue)}>
                      <Plus className="mr-2 h-4 w-4" />
                      新規作成: {searchValue}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 説明テキスト */}
      <p className="text-xs text-muted-foreground">
        最大{maxTags}個まで選択できます（現在: {value.length}個）
      </p>
    </div>
  );
}
