import type { Editor, Extensions } from "@tiptap/core";

export interface EditorConfig {
  extensions: Extensions;
  content?: string;
  editable?: boolean;
  placeholder?: string;
}

export interface EditorToolbarProps {
  editor: Editor | null;
}

export interface UseTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  extensions: Extensions;
  editable?: boolean;
}

export interface TextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  showToolbar?: boolean;
  enableVoiceInput?: boolean;
  className?: string;
}
