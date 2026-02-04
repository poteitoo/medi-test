import { Effect, Stream } from "effect";
import { startVoiceInput } from "../../application/usecases/start-voice-input";
import { stopVoiceInput } from "../../application/usecases/stop-voice-input";
import { BrowserLayer } from "../../infrastructure/layers/browser-layer";
import type { VoiceInputConfig } from "../../domain/models/voice-input";
import type { RecordingResult } from "../../application/ports/audio-recorder";
import type { TranscriptSegment } from "../../domain/models/voice-input";

/**
 * Adapter: Effect Program を実行 (React state は持たない)
 */
export const voiceInputAdapter = {
  /**
   * 音声入力を開始 (Stream<TranscriptSegment> を返す)
   */
  start: (config: VoiceInputConfig) => {
    const program = startVoiceInput(config).pipe(Effect.provide(BrowserLayer));

    return Effect.runPromise(program);
  },

  /**
   * 音声入力を停止 (RecordingResult を返す)
   */
  stop: () => {
    const program = stopVoiceInput().pipe(Effect.provide(BrowserLayer));

    return Effect.runPromise(program);
  },
};
