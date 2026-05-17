"use client";

import {
  FastForward,
  Loader2,
  Pause,
  Play,
  Repeat,
  Rewind,
  SkipBack,
  SkipForward,
  Square,
} from "lucide-react";
import { BPM, KEY_LABEL, TRACKS } from "@/lib/constants";
import { EJAY_TRACK } from "@/lib/ejayTheme";
import type { TransportState } from "@/lib/types";

type TransportPanelProps = {
  transportState: TransportState;
  isAudioReady: boolean;
  onTogglePlayPause: () => void;
  onStop: () => void;
};

export function TransportPanel({
  transportState,
  isAudioReady,
  onTogglePlayPause,
  onStop,
}: TransportPanelProps) {
  const isPlaying = transportState === "playing";

  return (
    <div className="ejay-inset mx-2 mb-1 flex shrink-0 flex-col gap-2 p-2">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="ejay-panel-label rounded px-3 py-1">Start.mix</div>
        <div className="ejay-transport-pill">
          <TransportButton label="Loop" disabled>
            <Repeat className="h-3.5 w-3.5" />
          </TransportButton>
          <TransportButton label="To start" disabled>
            <SkipBack className="h-3.5 w-3.5" />
          </TransportButton>
          <TransportButton label="Rewind" disabled>
            <Rewind className="h-3.5 w-3.5" />
          </TransportButton>
        <button
          type="button"
          className="ejay-btn ejay-btn-transport"
          onClick={onStop}
          disabled={!isAudioReady}
          aria-label="Stop"
        >
          <Square className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="ejay-btn ejay-btn-play flex items-center justify-center"
          onClick={onTogglePlayPause}
          disabled={!isAudioReady}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {!isAudioReady ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5" />
          )}
        </button>
          <TransportButton label="Forward" disabled>
            <FastForward className="h-3.5 w-3.5" />
          </TransportButton>
          <TransportButton label="To end" disabled>
            <SkipForward className="h-3.5 w-3.5" />
          </TransportButton>
        </div>
        <div className="ejay-panel-label rounded px-3 py-1">
          {BPM} BPM · Key {KEY_LABEL}
        </div>
      </div>

      <div className="flex items-end justify-center gap-3 border-t border-[#1e3a5f] pt-2">
        <span className="ejay-panel-label self-center rounded px-2 py-1">Volume Controls</span>
        {TRACKS.map((track, index) => (
          <MixerFader key={track.id} label={track.label} index={index} />
        ))}
        <div className="ml-2 flex flex-col items-center gap-1 border-l border-[#1e3a5f] pl-4">
          <span className="text-[9px] font-black uppercase text-[#f6df85]">Master</span>
          <div className="ejay-fader-track h-20">
            <div className="ejay-fader-fill" style={{ height: "78%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TransportButton({
  children,
  label,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="ejay-btn ejay-btn-transport"
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function MixerFader({ label, index }: { label: string; index: number }) {
  const track = TRACKS[index];
  const theme = EJAY_TRACK[track.id];
  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" className="ejay-btn h-4 w-5 px-0 text-[8px]" title={`Mute ${label}`}>
        M
      </button>
      <div className="ejay-fader-track">
        <div className="ejay-fader-fill" style={{ height: `${56 + (index % 3) * 12}%` }} />
      </div>
      <span className={`text-[9px] font-black uppercase ${theme.categoryAccent.replace("border-", "text-")}`}>
        {index + 1}
      </span>
    </div>
  );
}
