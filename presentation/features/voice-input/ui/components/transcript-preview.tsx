import type { TranscriptSegment } from "../../domain/models/voice-input";

export interface TranscriptPreviewProps {
  transcripts: TranscriptSegment[];
  audioBlob: Blob | null;
  duration: number;
}

/**
 * 書き起こしプレビュー
 */
export const TranscriptPreview = ({
  transcripts,
  audioBlob,
  duration,
}: TranscriptPreviewProps) => {
  const handlePlayback = () => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audio.play();
  };

  return (
    <div className="mt-4 p-4 border border-border rounded-md bg-muted/50">
      <h4 className="text-sm font-semibold mb-2">書き起こし結果</h4>

      <div className="space-y-2 mb-4">
        {transcripts.map((segment, index) => (
          <div
            key={index}
            className={
              segment.isFinal ? "text-foreground" : "text-muted-foreground"
            }
          >
            <span className="text-xs">
              [{(segment.confidence * 100).toFixed(0)}%]
            </span>{" "}
            {segment.text}
          </div>
        ))}
      </div>

      {audioBlob && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlayback}
            className="text-sm text-primary hover:underline"
          >
            再生
          </button>
          <span className="text-xs text-muted-foreground">
            録音時間: {duration.toFixed(1)}秒
          </span>
        </div>
      )}
    </div>
  );
};
