import { Effect, Stream } from "effect";
import type { SpeechRecognitionService } from "../../application/ports/speech-recognition";
import { TranscriptSegment } from "../../domain/models/voice-input";
import {
  VoiceInputError,
  BrowserNotSupportedError,
} from "../../domain/errors/voice-input-errors";

/**
 * Web Speech API の実装
 */
export const makeSpeechRecognitionAdapter = (): SpeechRecognitionService => {
  let recognition: SpeechRecognition | null = null;

  return {
    isSupported: () =>
      Effect.sync(() => {
        return (
          "webkitSpeechRecognition" in window || "SpeechRecognition" in window
        );
      }),

    start: (config) =>
      Stream.async<
        TranscriptSegment,
        VoiceInputError | BrowserNotSupportedError
      >((emit) => {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
          emit.fail(
            new BrowserNotSupportedError({ feature: "SpeechRecognition" }),
          );
          return;
        }

        recognition = new SpeechRecognition();
        recognition.lang = config.language;
        recognition.continuous = config.continuous;
        recognition.interimResults = config.interimResults;

        recognition.onresult = (event) => {
          const results = event.results;
          const lastResult = results[results.length - 1];
          const transcript = lastResult[0].transcript;
          const confidence = lastResult[0].confidence;

          emit.single(
            new TranscriptSegment({
              text: transcript,
              confidence,
              isFinal: lastResult.isFinal,
              timestamp: Date.now(),
            }),
          );
        };

        recognition.onerror = (event) => {
          emit.fail(new VoiceInputError({ message: event.error }));
        };

        recognition.onend = () => {
          emit.end();
        };

        recognition.start();
      }),

    stop: () =>
      Effect.sync(() => {
        if (recognition) {
          recognition.stop();
          recognition = null;
        }
      }),
  };
};
