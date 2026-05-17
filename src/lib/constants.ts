import type { AudioBlock, GridState, TrackId } from "./types";

export const BPM = 100;
export const KEY_LABEL = "Am";
export const BARS_PER_BLOCK = 4;
export const BLOCK_COUNT = 4;
export const TOTAL_BARS = BARS_PER_BLOCK * BLOCK_COUNT;

export const TRACKS: { id: TrackId; label: string }[] = [
  { id: "drums", label: "Drums" },
  { id: "bass", label: "Bass" },
  { id: "synth", label: "Synth" },
  { id: "guitar", label: "Guitar" },
];

export const TRACK_ORDER: TrackId[] = ["drums", "bass", "synth", "guitar"];

export const AUDIO_BLOCKS: AudioBlock[] = [
  { id: "drums-boom-bap", name: "Boom Bap", track: "drums", url: "/audio/drums_1.mp3", color: "violet" },
  { id: "drums-trap", name: "Trap Kit", track: "drums", url: "/audio/drums_2.mp3", color: "violet" },
  { id: "drums-house", name: "House", track: "drums", url: "/audio/drums_3.mp3", color: "violet" },
  { id: "bass-funk", name: "Funk Bass", track: "bass", url: "/audio/bass_1.mp3", color: "blue" },
  { id: "bass-sub", name: "Sub Low", track: "bass", url: "/audio/bass_2.mp3", color: "blue" },
  { id: "bass-slap", name: "Slap", track: "bass", url: "/audio/bass_3.mp3", color: "blue" },
  { id: "synth-pad", name: "Pad", track: "synth", url: "/audio/synth_1.mp3", color: "cyan" },
  { id: "synth-pluck", name: "Pluck", track: "synth", url: "/audio/synth_2.mp3", color: "cyan" },
  { id: "synth-lead", name: "Lead", track: "synth", url: "/audio/synth_3.mp3", color: "cyan" },
  { id: "guitar-clean", name: "Clean", track: "guitar", url: "/audio/guitar_1.mp3", color: "orange" },
  { id: "guitar-funk", name: "Funk Chop", track: "guitar", url: "/audio/guitar_2.mp3", color: "orange" },
  { id: "guitar-dist", name: "Dist", track: "guitar", url: "/audio/guitar_3.mp3", color: "orange" },
];

export function createEmptyGrid(): GridState {
  return TRACK_ORDER.map(() =>
    Array.from({ length: BLOCK_COUNT }, () => ({ blockId: null }))
  );
}

export function getBlockById(id: string): AudioBlock | undefined {
  return AUDIO_BLOCKS.find((b) => b.id === id);
}

export function getTrackIndex(track: TrackId): number {
  return TRACK_ORDER.indexOf(track);
}

export const AI_GRID_PRESETS: { keywords: string[]; grid: GridState }[] = [
  {
    keywords: ["dark", "hip hop", "hip-hop", "trap", "boom bap", "mørkt", "hiphop"],
    grid: [
      [{ blockId: "drums-boom-bap" }, { blockId: null }, { blockId: "drums-trap" }, { blockId: null }],
      [{ blockId: "bass-sub" }, { blockId: "bass-funk" }, { blockId: null }, { blockId: "bass-sub" }],
      [{ blockId: null }, { blockId: "synth-pad" }, { blockId: "synth-pad" }, { blockId: null }],
      [{ blockId: null }, { blockId: null }, { blockId: "guitar-funk" }, { blockId: "guitar-dist" }],
    ],
  },
  {
    keywords: ["house", "dance", "club", "edm"],
    grid: [
      [{ blockId: "drums-house" }, { blockId: "drums-house" }, { blockId: null }, { blockId: "drums-house" }],
      [{ blockId: "bass-funk" }, { blockId: null }, { blockId: "bass-funk" }, { blockId: null }],
      [{ blockId: "synth-pluck" }, { blockId: "synth-pluck" }, { blockId: "synth-lead" }, { blockId: null }],
      [{ blockId: null }, { blockId: "guitar-clean" }, { blockId: null }, { blockId: "guitar-clean" }],
    ],
  },
  {
    keywords: ["ambient", "chill", "lofi", "lo-fi", "relax"],
    grid: [
      [{ blockId: null }, { blockId: "drums-boom-bap" }, { blockId: null }, { blockId: null }],
      [{ blockId: "bass-sub" }, { blockId: null }, { blockId: null }, { blockId: "bass-sub" }],
      [{ blockId: "synth-pad" }, { blockId: "synth-pad" }, { blockId: "synth-pad" }, { blockId: "synth-pad" }],
      [{ blockId: "guitar-clean" }, { blockId: null }, { blockId: null }, { blockId: "guitar-clean" }],
    ],
  },
];

export const AI_DEFAULT_GRID: GridState = [
  [{ blockId: "drums-trap" }, { blockId: null }, { blockId: "drums-trap" }, { blockId: null }],
  [{ blockId: "bass-funk" }, { blockId: null }, { blockId: "bass-funk" }, { blockId: null }],
  [{ blockId: "synth-lead" }, { blockId: "synth-pluck" }, { blockId: null }, { blockId: "synth-lead" }],
  [{ blockId: null }, { blockId: "guitar-funk" }, { blockId: "guitar-funk" }, { blockId: null }],
];

export function matchAiGrid(prompt: string): GridState {
  const lower = prompt.toLowerCase();
  for (const preset of AI_GRID_PRESETS) {
    if (preset.keywords.some((kw) => lower.includes(kw))) {
      return preset.grid.map((row) => row.map((slot) => ({ ...slot })));
    }
  }
  return AI_DEFAULT_GRID.map((row) => row.map((slot) => ({ ...slot })));
}
