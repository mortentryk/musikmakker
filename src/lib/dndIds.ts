export function libraryDraggableId(blockId: string): string {
  return `library:${blockId}`;
}

export function gridDraggableId(row: number, col: number): string {
  return `grid:${row}:${col}`;
}

export function cellDroppableId(row: number, col: number): string {
  return `cell:${row}:${col}`;
}

export function parseCellDroppableId(id: string): { row: number; col: number } | null {
  const match = /^cell:(\d+):(\d+)$/.exec(id);
  if (!match) return null;
  return { row: Number(match[1]), col: Number(match[2]) };
}

export function parseDraggableSource(id: string): { type: "library" | "grid"; blockId?: string; row?: number; col?: number } | null {
  const lib = /^library:(.+)$/.exec(id);
  if (lib) return { type: "library", blockId: lib[1] };
  const grid = /^grid:(\d+):(\d+)$/.exec(id);
  if (grid) return { type: "grid", row: Number(grid[1]), col: Number(grid[2]) };
  return null;
}
