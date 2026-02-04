import { Effect } from "effect";
import { SpeechRecognitionService } from "../ports/speech-recognition";
import { AudioRecorderService } from "../ports/audio-recorder";
import type { VoiceInputConfig } from "../../domain/models/voice-input";

/**
 * 音声入力を開始する usecase
 * - 音声認識を開始
 * - 同時に録音を開始
 */
export const startVoiceInput = (config: VoiceInputConfig) =>
  Effect.gen(function* () {
    const speechRecognition = yield* SpeechRecognitionService;
    const audioRecorder = yield* AudioRecorderService;

    // 録音開始
    yield* audioRecorder.startRecording();

    // 音声認識開始 (Stream を返す)
    return speechRecognition.start({
      language: config.language,
      continuous: config.continuous,
      interimResults: config.interimResults,
    });
  });
