export type Transcription = { text: string; providerReference: string; ambiguous: boolean };
export interface TranscriptionPort { transcribe(fileReference: string, idempotencyKey: string): Promise<Transcription>; }
