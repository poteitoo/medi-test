import { useEffect } from "react";

/**
 * グローバルキーボードショートカットフック
 *
 * @param key - ショートカットキー（例: "c"）
 * @param callback - キーが押されたときに実行される関数
 */
export function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // input/textarea 内では無視
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + key の組み合わせは無視
      if (e.metaKey || e.ctrlKey) {
        return;
      }

      // 指定されたキーが押された場合
      if (e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [key, callback]);
}
