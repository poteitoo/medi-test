import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import type { EditorToolbarProps } from "../types/editor-types";

export const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-border bg-muted/50 p-2 flex flex-wrap gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="太字"
        aria-pressed={editor.isActive("bold")}
        className={editor.isActive("bold") ? "bg-accent" : ""}
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="斜体"
        aria-pressed={editor.isActive("italic")}
        className={editor.isActive("italic") ? "bg-accent" : ""}
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="下線"
        aria-pressed={editor.isActive("underline")}
        className={editor.isActive("underline") ? "bg-accent" : ""}
      >
        <Underline className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        aria-label="取り消し線"
        aria-pressed={editor.isActive("strike")}
        className={editor.isActive("strike") ? "bg-accent" : ""}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 self-center" />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="見出し 1"
        aria-pressed={editor.isActive("heading", { level: 1 })}
        className={editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="見出し 2"
        aria-pressed={editor.isActive("heading", { level: 2 })}
        className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-label="見出し 3"
        aria-pressed={editor.isActive("heading", { level: 3 })}
        className={editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""}
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 self-center" />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="箇条書きリスト"
        aria-pressed={editor.isActive("bulletList")}
        className={editor.isActive("bulletList") ? "bg-accent" : ""}
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="番号付きリスト"
        aria-pressed={editor.isActive("orderedList")}
        className={editor.isActive("orderedList") ? "bg-accent" : ""}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 self-center" />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="元に戻す"
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="やり直す"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};
