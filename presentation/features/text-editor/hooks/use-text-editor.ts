import * as React from "react";
import { useEditor, type Editor } from "@tiptap/react";
import type { UseTextEditorProps } from "../types/editor-types";

export const useTextEditor = ({
  content = "",
  onChange,
  extensions,
  editable = true,
}: UseTextEditorProps): Editor | null => {
  const handleUpdate = React.useCallback(
    ({ editor }: { editor: Editor }) => {
      onChange?.(editor.getHTML());
    },
    [onChange],
  );

  const editor = useEditor({
    extensions,
    content,
    editable,
    onUpdate: handleUpdate,
  });

  return editor;
};
