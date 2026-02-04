import { Context, Effect, Stream } from "effect";
import type { TranscriptSegment } from "../../domain/models/voice-input";
import type {
  VoiceInputError,
  BrowserNotSupportedError,
} from "../../domain/errors/voice-input-errors";

/**
 * 音声認識サービスのポート (インターフェース)
 */
export interface SpeechRecognitionService {
  /**
   * 音声認識を開始し、書き起こし結果をストリームとして返す
   */
  readonly start: (config: {
    language: string;
    continuous: boolean;
    interimResults: boolean;
  }) => Stream.Stream<
    TranscriptSegment,
    VoiceInputError | BrowserNotSupportedError
  >;

  /**
   * 音声認識を停止
   */
  readonly stop: () => Effect.Effect<void, never>;

  /**
   * ブラウザが音声認識をサポートしているか確認
   */
  readonly isSupported: () => Effect.Effect<boolean, never>;
}

export const SpeechRecognitionService =
  Context.GenericTag<SpeechRecognitionService>(
    "@services/SpeechRecognitionService",
  );
