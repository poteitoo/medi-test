import { Layer } from "effect";
import { SpeechRecognitionService } from "../../application/ports/speech-recognition";
import { AudioRecorderService } from "../../application/ports/audio-recorder";
import { makeSpeechRecognitionAdapter } from "../adapters/web-speech-adapter";
import { makeMediaRecorderAdapter } from "../adapters/media-recorder-adapter";

/**
 * ブラウザ API 実装を提供する Layer
 */
export const BrowserLayer = Layer.mergeAll(
  Layer.succeed(SpeechRecognitionService, makeSpeechRecognitionAdapter()),
  Layer.succeed(AudioRecorderService, makeMediaRecorderAdapter()),
);
