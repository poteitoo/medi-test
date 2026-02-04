import { Effect } from "effect";
import { SpeechRecognitionService } from "../ports/speech-recognition";
import { AudioRecorderService } from "../ports/audio-recorder";

/**
 * 音声入力を停止する usecase
 * - 音声認識を停止
 * - 録音を停止し、録音データを取得
 */
export const stopVoiceInput = () =>
  Effect.gen(function* () {
    const speechRecognition = yield* SpeechRecognitionService;
    const audioRecorder = yield* AudioRecorderService;

    // 音声認識停止
    yield* speechRecognition.stop();

    // 録音停止・データ取得
    const result = yield* audioRecorder.stopRecording();

    return result;
  });
