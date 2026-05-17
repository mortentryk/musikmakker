import type { TrackId } from "./types";

export const EJAY_TRACK: Record<
  TrackId,
  {
    label: string;
    blockClass: string;
    iconBg: string;
    iconBorder: string;
    categoryAccent: string;
  }
> = {
  drums: {
    label: "Drums",
    blockClass: "ejay-block-drums",
    iconBg: "bg-violet-600",
    iconBorder: "border-violet-400",
    categoryAccent: "border-violet-500",
  },
  bass: {
    label: "Bass",
    blockClass: "ejay-block-bass",
    iconBg: "bg-amber-500",
    iconBorder: "border-amber-300",
    categoryAccent: "border-amber-500",
  },
  synth: {
    label: "Synth",
    blockClass: "ejay-block-synth",
    iconBg: "bg-cyan-600",
    iconBorder: "border-cyan-400",
    categoryAccent: "border-cyan-500",
  },
  guitar: {
    label: "Guitar",
    blockClass: "ejay-block-guitar",
    iconBg: "bg-orange-600",
    iconBorder: "border-orange-400",
    categoryAccent: "border-orange-500",
  },
};

export function waveformHeights(seed: string, count = 8): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
  return Array.from({ length: count }, (_, i) => {
    const v = Math.abs(Math.sin(hash + i * 1.7)) * 100;
    return 20 + (v % 80);
  });
}
