import * as React from "react";
import { EditorContent } from "@tiptap/react";
import { cn } from "~/lib/utils";
import { useTextEditor } from "./hooks/use-text-editor";
import { basicExtensions } from "./extensions";
import { EditorToolbar } from "./components/toolbar";
import { VoiceInputControl } from "~/features/voice-input/ui";
import type { TextEditorProps } from "./types/editor-types";

export const TextEditor = React.forwardRef<HTMLDivElement, TextEditorProps>(
  (
    {
      content = "",
      onChange,
      placeholder = "診察内容を入力してください...",
      editable = true,
      showToolbar = false,
      enableVoiceInput = false,
      className,
    },
    ref,
  ) => {
    const editor = useTextEditor({
      content,
      onChange,
      extensions: basicExtensions,
      editable,
    });

    // 音声入力のテキストをエディターに挿入
    const handleTranscriptUpdate = React.useCallback(
      (text: string) => {
        if (!editor) return;

        // エディターの最後にテキストを追加
        editor.chain().focus("end").insertContent(` ${text}`).run();
      },
      [editor],
    );

    return (
      <div className="space-y-2">
        {enableVoiceInput && (
          <VoiceInputControl onTranscriptUpdate={handleTranscriptUpdate} />
        )}

        <div
          ref={ref}
          className={cn(
            "border border-input rounded-md bg-background",
            "focus-within:ring-ring/50 focus-within:ring-[3px]",
            "transition-shadow",
            className,
          )}
          role="textbox"
          aria-label="診察内容エディター"
          aria-multiline="true"
        >
          {showToolbar && <EditorToolbar editor={editor} />}
          <EditorContent editor={editor} className="tiptap" />
        </div>
      </div>
    );
  },
);

TextEditor.displayName = "TextEditor";
