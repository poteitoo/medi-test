import { Context, Effect } from "effect";
import type {
  RecordingError,
  BrowserNotSupportedError,
  MicrophonePermissionDeniedError,
} from "../../domain/errors/voice-input-errors";

export interface RecordingResult {
  blob: Blob;
  duration: number; // 秒
}

/**
 * 音声録音サービスのポート (インターフェース)
 */
export interface AudioRecorderService {
  /**
   * 録音を開始
   */
  readonly startRecording: () => Effect.Effect<
    void,
    RecordingError | BrowserNotSupportedError | MicrophonePermissionDeniedError
  >;

  /**
   * 録音を停止し、録音データを返す
   */
  readonly stopRecording: () => Effect.Effect<RecordingResult, RecordingError>;

  /**
   * ブラウザが録音をサポートしているか確認
   */
  readonly isSupported: () => Effect.Effect<boolean, never>;
}

export const AudioRecorderService = Context.GenericTag<AudioRecorderService>(
  "@services/AudioRecorderService",
);
