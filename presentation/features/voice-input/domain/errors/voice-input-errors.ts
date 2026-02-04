import { Data } from "effect";

export class VoiceInputError extends Data.TaggedError("VoiceInputError")<{
  message: string;
}> {}

export class BrowserNotSupportedError extends Data.TaggedError(
  "BrowserNotSupportedError",
)<{
  feature: "SpeechRecognition" | "MediaRecorder";
}> {}

export class MicrophonePermissionDeniedError extends Data.TaggedError(
  "MicrophonePermissionDeniedError",
)<{
  message: string;
}> {}

export class RecordingError extends Data.TaggedError("RecordingError")<{
  message: string;
}> {}
