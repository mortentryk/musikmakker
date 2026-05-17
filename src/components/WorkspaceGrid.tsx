"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { WaveformBars } from "@/components/WaveformBars";
import { BLOCK_COUNT, TRACKS } from "@/lib/constants";
import { cellDroppableId, gridDraggableId } from "@/lib/dndIds";
import { TRACK_THEME } from "@/lib/studioTheme";
import type { AiDropHint, GameFeedback, GridState } from "@/lib/types";

type WorkspaceGridProps = {
  grid: GridState;
  playheadColumn: number;
  aiHint: AiDropHint;
  feedback: GameFeedback;
  onCellClick: (rowIndex: number, colIndex: number) => void;
  getSlotLabel: (blockId: string | null) => string | null;
};

export function WorkspaceGrid({
  grid,
  playheadColumn,
  aiHint,
  feedback,
  onCellClick,
  getSlotLabel,
}: WorkspaceGridProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="mm-inset relative m-2 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute bottom-0 top-0 z-10 mm-playhead-col transition-all duration-75"
          style={{
            left: `calc(4.5rem + ${playheadColumn} * ((100% - 4.5rem) / ${BLOCK_COUNT}))`,
            width: `calc((100% - 4.5rem) / ${BLOCK_COUNT})`,
          }}
        />
        <div className="relative z-20 flex min-h-0 flex-1 flex-col">
          {TRACKS.map((track, rowIndex) => {
            const theme = TRACK_THEME[track.id];
            return (
              <div
                key={track.id}
                className="grid flex-1 grid-cols-[4.5rem_1fr] border-b border-[#1e3a5f] last:border-b-0"
              >
                <div className="flex flex-col items-center justify-center gap-1 border-r border-[#1e3a5f] bg-[#0a1020]/70 py-1">
                  <button
                    type="button"
                    className={`mm-btn h-7 w-8 px-0 text-[11px] ${theme.categoryAccent}`}
                    aria-label={`Track ${rowIndex + 1} ${theme.label}`}
                  >
                    {rowIndex + 1}
                  </button>
                  <span className="text-[9px] font-black uppercase tracking-wide text-[#d9c06a]">
                    {theme.label}
                  </span>
                </div>
                <div className="grid grid-cols-4">
                  {grid[rowIndex].map((slot, colIndex) => (
                    <GridCell
                      key={`${track.id}-${colIndex}`}
                      rowIndex={rowIndex}
                      colIndex={colIndex}
                      blockId={slot.blockId}
                      theme={theme}
                      playheadColumn={playheadColumn}
                      aiHint={aiHint}
                      feedback={feedback}
                      getSlotLabel={getSlotLabel}
                      onCellClick={onCellClick}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GridCell({
  rowIndex,
  colIndex,
  blockId,
  theme,
  playheadColumn,
  aiHint,
  feedback,
  getSlotLabel,
  onCellClick,
}: {
  rowIndex: number;
  colIndex: number;
  blockId: string | null;
  theme: (typeof TRACK_THEME)[keyof typeof TRACK_THEME];
  playheadColumn: number;
  aiHint: AiDropHint;
  feedback: GameFeedback;
  getSlotLabel: (blockId: string | null) => string | null;
  onCellClick: (rowIndex: number, colIndex: number) => void;
}) {
  const filled = Boolean(blockId);
  const isPlayheadCol = colIndex === playheadColumn;
  const isAiHint =
    aiHint && aiHint.row === rowIndex && aiHint.col === colIndex;
  const isPlacedFeedback =
    feedback?.kind === "placed" && feedback.row === rowIndex && feedback.col === colIndex;
  const isInvalidFeedback =
    feedback?.kind === "invalid" && feedback.row === rowIndex && feedback.col === colIndex;
  const label = getSlotLabel(blockId);

  return (
    <Droppable droppableId={cellDroppableId(rowIndex, colIndex)}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="relative min-h-[4.5rem] border-r border-[#1a3050] last:border-r-0"
        >
          {filled && blockId ? (
            <Draggable draggableId={gridDraggableId(rowIndex, colIndex)} index={0}>
              {(dragProvided, dragSnapshot) => (
                <button
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  {...dragProvided.dragHandleProps}
                  type="button"
                  onClick={() => onCellClick(rowIndex, colIndex)}
                  className={`relative flex h-full min-h-[4.5rem] w-full flex-col items-center justify-center p-1 transition mm-block ${theme.blockClass} ${
                    isPlayheadCol ? "ring-2 ring-[#7fff7f] ring-inset" : ""
                  } ${dragSnapshot.isDragging ? "mm-cartridge-dragging opacity-90" : ""} ${
                    isPlacedFeedback ? "mm-block-placed" : ""
                  }`}
                >
                  <span className="z-10 max-w-full truncate px-1 text-center text-[11px] font-black leading-tight">
                    {label}
                  </span>
                  <WaveformBars seed={blockId} />
                </button>
              )}
            </Draggable>
          ) : (
            <button
              type="button"
              onClick={() => onCellClick(rowIndex, colIndex)}
              className={`flex h-full min-h-[4.5rem] w-full flex-col items-center justify-center border border-dashed p-1 transition ${
                snapshot.isDraggingOver
                  ? "mm-drag-over border-violet-400/60 bg-zinc-800"
                  : isAiHint
                    ? "mm-ai-hint-cell border-emerald-400/60 bg-emerald-950/40"
                    : `mm-cell-empty ${isPlayheadCol ? "mm-playhead-col" : "border-zinc-700"}`
              } ${isInvalidFeedback ? "mm-invalid-drop" : ""}`}
            >
              {isAiHint && aiHint ? (
                <span className="px-1 text-center text-[9px] font-black leading-tight text-[#d8ffb0]">
                  {aiHint.message}
                </span>
              ) : (
                <span className="text-[11px] font-black text-[#6c8ee8]">DROP</span>
              )}
            </button>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
