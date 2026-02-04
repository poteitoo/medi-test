import { Mic, Square } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useVoiceInput } from "../hooks/use-voice-input";
import { RecordingIndicator } from "./recording-indicator";
import { TranscriptPreview } from "./transcript-preview";

export interface VoiceInputControlProps {
  onTranscriptUpdate?: (text: string) => void;
  className?: string;
}

/**
 * 音声入力コントロール UI
 */
export const VoiceInputControl = ({
  onTranscriptUpdate,
  className,
}: VoiceInputControlProps) => {
  const {
    status,
    transcripts,
    audioBlob,
    duration,
    error,
    startRecording,
    stopRecording,
  } = useVoiceInput(onTranscriptUpdate);

  const isRecording = status === "recording" || status === "listening";

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={startRecording}
            aria-label="音声入力を開始"
          >
            <Mic className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={stopRecording}
            aria-label="音声入力を停止"
          >
            <Square className="h-4 w-4" />
          </Button>
        )}

        {isRecording && <RecordingIndicator />}
      </div>

      {error && (
        <p className="text-sm text-destructive mt-2" role="alert">
          {error}
        </p>
      )}

      {transcripts.length > 0 && (
        <TranscriptPreview
          transcripts={transcripts}
          audioBlob={audioBlob}
          duration={duration}
        />
      )}
    </div>
  );
};
