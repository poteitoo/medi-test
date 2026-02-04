import { Data } from "effect";

/**
 * 書き起こしの1セグメント
 */
export class TranscriptSegment extends Data.Class<{
  text: string; // 認識されたテキスト
  confidence: number; // 信頼度 (0-1)
  isFinal: boolean; // 確定済みかどうか
  timestamp: number; // タイムスタンプ (ms)
}> {}

/**
 * 音声入力の状態
 */
export type VoiceInputStatus = "idle" | "listening" | "recording" | "stopped";

export class VoiceInputState extends Data.Class<{
  status: VoiceInputStatus;
  transcripts: ReadonlyArray<TranscriptSegment>;
  audioBlob: Blob | null;
  duration: number; // 録音時間 (秒)
  error: string | null;
}> {}

/**
 * 音声入力の設定
 */
export class VoiceInputConfig extends Data.Class<{
  language: string; // 認識言語 (例: "ja-JP")
  continuous: boolean; // 連続認識
  interimResults: boolean; // 中間結果を取得
  maxAlternatives: number; // 認識候補の最大数
}> {
  static readonly default = new VoiceInputConfig({
    language: "ja-JP",
    continuous: true,
    interimResults: true,
    maxAlternatives: 1,
  });
}
