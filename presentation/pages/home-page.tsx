import { useState } from "react";
import { TextEditor } from "~/features/text-editor";

export function meta() {
  return [
    { title: "Theta - Effect TS Architecture" },
    { name: "description", content: "医療系アプリケーションのユーザー向けUI" },
  ];
}

export default function HomePage() {
  const [content, setContent] = useState(
    "<p>ここに診察内容を入力してください...</p>",
  );

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Welcome to Theta</h1>
        <p className="text-lg text-muted-foreground">
          Effect TS
          を使った関数型プログラミングのエッセンスで構築する医療系アプリケーション
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">診察記録エディター</h2>
        <TextEditor
          content={content}
          onChange={setContent}
          showToolbar
          enableVoiceInput
          className="max-w-4xl"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">エディターの内容（HTML）:</h3>
        <pre className="p-4 bg-muted rounded-md overflow-x-auto text-sm">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
}
