"use client";

import { Check, Loader2, Mic, Sparkles } from "lucide-react";
import type { RecordingPhase } from "@/lib/types";

type LiveRecordStripProps = {
  recordingPhase: RecordingPhase;
  countInBeat: number;
  hasRecording: boolean;
  mixOptimizing: boolean;
  mixOptimized: boolean;
  recordError: string | null;
  onStartRecording: () => void;
  onAiMix: () => void;
};

export function LiveRecordStrip({
  recordingPhase,
  countInBeat,
  hasRecording,
  mixOptimizing,
  mixOptimized,
  recordError,
  onStartRecording,
  onAiMix,
}: LiveRecordStripProps) {
  const isBusy = recordingPhase === "counting" || recordingPhase === "recording";

  return (
    <div className="mx-2 mb-2 flex items-center gap-4 rounded-lg border border-[#1e3a5f] bg-[#0a1020]/80 px-4 py-2">
      <span className="text-[10px] font-bold uppercase tracking-wide text-[#8fa8c8]">
        Vokal / Guitar
      </span>

      {recordingPhase === "counting" && (
        <span className="text-3xl font-black tabular-nums text-red-400 ejay-count-in">
          {countInBeat}
        </span>
      )}

      {recordingPhase === "recording" && (
        <span className="flex items-center gap-2 text-sm text-red-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Optager...
        </span>
      )}

      <button
        type="button"
        onClick={onStartRecording}
        disabled={isBusy}
        className="ejay-btn-record flex items-center gap-2 rounded-lg px-4 py-2 disabled:opacity-50"
        aria-label="Optag"
      >
        <Mic className="h-4 w-4" />
        Record
      </button>

      <button
        type="button"
        onClick={onAiMix}
        disabled={!hasRecording || mixOptimizing}
        className="ejay-btn flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-950/40 px-3 py-2 text-xs disabled:opacity-40"
      >
        {mixOptimizing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : mixOptimized ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-violet-300" />
        )}
        AI Clean &amp; Optimize
      </button>

      {recordError && <p className="text-xs text-red-400">{recordError}</p>}
      {hasRecording && !recordError && recordingPhase === "recorded" && (
        <span className="text-[10px] text-emerald-400/80">Optagelse klar</span>
      )}
    </div>
  );
}
