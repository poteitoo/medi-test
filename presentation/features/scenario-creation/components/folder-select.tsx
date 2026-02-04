import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Folder } from "../types/scenario-types";

interface FolderSelectProps {
  value?: string;
  onChange: (value: string) => void;
  folders: Folder[];
}

export function FolderSelect({ value, onChange, folders }: FolderSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="フォルダーを選択（任意）" />
      </SelectTrigger>
      <SelectContent>
        {folders.map((folder) => (
          <SelectItem key={folder.id} value={folder.id}>
            <span className="flex items-center gap-2">
              {folder.icon && <span>{folder.icon}</span>}
              <span>{folder.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
