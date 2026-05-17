import type { GridState } from "./types";
import { getBlockById, getTrackIndex } from "./constants";
import type { AiDropHint } from "./types";

const HINT_MAP: Record<
  string,
  { suggestTrack: "bass" | "synth" | "guitar"; suggestBlockId: string; message: string }
> = {
  "drums-boom-bap": {
    suggestTrack: "bass",
    suggestBlockId: "bass-sub",
    message: "Jeg har fundet en bas-klods, der passer perfekt til de trommer – slip den her!",
  },
  "drums-trap": {
    suggestTrack: "bass",
    suggestBlockId: "bass-sub",
    message: "Trap-bas her – slip den her!",
  },
  "drums-house": {
    suggestTrack: "bass",
    suggestBlockId: "bass-funk",
    message: "Funk-bas matcher house-trommerne – slip her!",
  },
  "bass-sub": {
    suggestTrack: "synth",
    suggestBlockId: "synth-pad",
    message: "Et ambient pad passer til sub-bassen – prøv her!",
  },
  "bass-funk": {
    suggestTrack: "guitar",
    suggestBlockId: "guitar-funk",
    message: "Funk-guitar komplementerer bassen – slip her!",
  },
};

export function getAiDropHint(blockId: string, grid: GridState): AiDropHint {
  const block = getBlockById(blockId);
  if (!block) return null;

  const preset = HINT_MAP[blockId];
  if (preset) {
    const row = getTrackIndex(preset.suggestTrack);
    const col = findFirstEmptyColumn(grid, row) ?? 0;
    return { row, col, message: preset.message, suggestBlockId: preset.suggestBlockId };
  }

  if (block.track === "drums") {
    const row = getTrackIndex("bass");
    const col = findFirstEmptyColumn(grid, row) ?? 0;
    return {
      row,
      col,
      suggestBlockId: "bass-sub",
      message: "Jeg har fundet en bas-klods, der passer perfekt til de trommer – slip den her!",
    };
  }

  return null;
}

function findFirstEmptyColumn(grid: GridState, row: number): number | null {
  for (let col = 0; col < grid[row]?.length; col++) {
    if (!grid[row][col].blockId) return col;
  }
  return null;
}
