export type TrackId = "drums" | "bass" | "synth" | "guitar";

export type GridSlot = {
  blockId: string | null;
};

export type GridState = GridSlot[][];

export type AudioBlock = {
  id: string;
  name: string;
  track: TrackId;
  url: string;
  color: string;
};

export type TransportState = "stopped" | "playing" | "paused";

export type RecordingPhase = "idle" | "counting" | "recording" | "recorded";

export type AiDropHint = {
  row: number;
  col: number;
  message: string;
  suggestBlockId?: string;
} | null;

export type GameFeedback = {
  id: number;
  message: string;
  kind: "placed" | "invalid" | "ai" | "recording" | "mix";
  row?: number;
  col?: number;
} | null;
