import { Effect } from "effect";
import type {
  AudioRecorderService,
  RecordingResult,
} from "../../application/ports/audio-recorder";
import {
  RecordingError,
  BrowserNotSupportedError,
  MicrophonePermissionDeniedError,
} from "../../domain/errors/voice-input-errors";

/**
 * MediaRecorder API の実装
 */
export const makeMediaRecorderAdapter = (): AudioRecorderService => {
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let startTime = 0;

  return {
    isSupported: () =>
      Effect.sync(() => {
        return "MediaRecorder" in window;
      }),

    startRecording: () =>
      Effect.tryPromise({
        try: async () => {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new BrowserNotSupportedError({ feature: "MediaRecorder" });
          }

          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            startTime = Date.now();

            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                audioChunks.push(event.data);
              }
            };

            mediaRecorder.start();
          } catch (error) {
            if (error instanceof Error && error.name === "NotAllowedError") {
              throw new MicrophonePermissionDeniedError({
                message: "マイクへのアクセスが拒否されました",
              });
            }
            throw new RecordingError({
              message: `録音開始エラー: ${error}`,
            });
          }
        },
        catch: (error) => {
          if (
            error instanceof BrowserNotSupportedError ||
            error instanceof MicrophonePermissionDeniedError
          ) {
            return error;
          }
          return new RecordingError({ message: String(error) });
        },
      }),

    stopRecording: () =>
      Effect.async<RecordingResult, RecordingError>((resume) => {
        if (!mediaRecorder) {
          resume(
            Effect.fail(
              new RecordingError({ message: "録音が開始されていません" }),
            ),
          );
          return;
        }

        mediaRecorder.onstop = () => {
          const duration = (Date.now() - startTime) / 1000;
          const blob = new Blob(audioChunks, { type: "audio/webm" });

          // ストリームを停止
          if (mediaRecorder?.stream) {
            mediaRecorder.stream.getTracks().forEach((track) => track.stop());
          }

          resume(Effect.succeed({ blob, duration }));
        };

        mediaRecorder.stop();
      }),
  };
};
