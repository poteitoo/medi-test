import { useState, useCallback } from "react";
import { Effect, Stream } from "effect";
import { voiceInputAdapter } from "../adapters/voice-input-adapter";
import type {
  VoiceInputStatus,
  TranscriptSegment,
} from "../../domain/models/voice-input";
import { VoiceInputConfig } from "../../domain/models/voice-input";

export interface UseVoiceInputResult {
  status: VoiceInputStatus;
  transcripts: TranscriptSegment[];
  audioBlob: Blob | null;
  duration: number;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
}

/**
 * Hook: React state を管理し、Adapter を呼び出す
 */
export const useVoiceInput = (
  onTranscriptUpdate?: (text: string) => void,
): UseVoiceInputResult => {
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setStatus("listening");
      setError(null);

      const stream = await voiceInputAdapter.start(VoiceInputConfig.default);

      // Stream を消費して transcripts を更新
      Stream.runForEach(stream, (segment) => {
        setTranscripts((prev) => [...prev, segment]);

        // エディターに挿入 (確定済みのセグメントのみ)
        if (segment.isFinal && onTranscriptUpdate) {
          onTranscriptUpdate(segment.text);
        }

        return Effect.void;
      });

      setStatus("recording");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("idle");
    }
  }, [onTranscriptUpdate]);

  const stopRecording = useCallback(async () => {
    try {
      setStatus("stopped");

      const result = await voiceInputAdapter.stop();

      setAudioBlob(result.blob);
      setDuration(result.duration);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("idle");
    }
  }, []);

  return {
    status,
    transcripts,
    audioBlob,
    duration,
    error,
    startRecording,
    stopRecording,
  };
};
