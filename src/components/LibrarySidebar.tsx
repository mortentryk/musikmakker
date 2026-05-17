"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Disc3, Headphones, Loader2 } from "lucide-react";
import { AUDIO_BLOCKS } from "@/lib/constants";
import { libraryDraggableId } from "@/lib/dndIds";
import { EJAY_TRACK } from "@/lib/ejayTheme";
import type { AudioBlock } from "@/lib/types";

type LibrarySidebarProps = {
  isAudioReady: boolean;
  onPreviewBlock: (block: AudioBlock) => void;
};

export function LibrarySidebar({ isAudioReady, onPreviewBlock }: LibrarySidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-l-2 border-[#3a2810] bg-gradient-to-b from-[#c9a050] via-[#b48a2c] to-[#74510f]">
      <div className="ejay-panel-label border-x-0 border-t-0 px-2 py-1 text-center">
        Sample Rack
      </div>
      <div className="ejay-inset m-1.5 flex flex-1 flex-col overflow-hidden">
        <p className="border-b border-[#1e3a5f] bg-[#061850]/70 px-2 py-1 text-[9px] font-bold text-[#d9c06a]">
          Klik = preview · Træk klods ind i banen
        </p>
        <Droppable droppableId="library-trash" isDropDisabled>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 overflow-y-auto p-2"
            >
              {AUDIO_BLOCKS.map((block, index) => {
                const theme = EJAY_TRACK[block.track];
                const showHeader =
                  index === 0 || AUDIO_BLOCKS[index - 1].track !== block.track;
                return (
                  <div key={block.id}>
                    {showHeader && (
                      <h3
                        className={`mb-1.5 mt-3 border-l-4 bg-[#061850]/50 px-1.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#f6df85] first:mt-0 ${theme.categoryAccent}`}
                      >
                        {theme.label}
                      </h3>
                    )}
                    <LibraryDraggable
                      block={block}
                      index={index}
                      theme={theme}
                      isAudioReady={isAudioReady}
                      onPreview={() => onPreviewBlock(block)}
                    />
                  </div>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </aside>
  );
}

function LibraryDraggable({
  block,
  index,
  theme,
  isAudioReady,
  onPreview,
}: {
  block: AudioBlock;
  index: number;
  theme: (typeof EJAY_TRACK)[AudioBlock["track"]];
  isAudioReady: boolean;
  onPreview: () => void;
}) {
  return (
    <Draggable draggableId={libraryDraggableId(block.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`ejay-cartridge mb-1.5 flex items-center gap-1 rounded-md p-1 ${
            snapshot.isDragging ? "ejay-cartridge-dragging shadow-2xl" : ""
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            disabled={!isAudioReady}
            className="ejay-btn shrink-0 p-1.5"
            title="Preview"
            aria-label={`Preview ${block.name}`}
          >
            {!isAudioReady ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Headphones className="h-3 w-3" />
            )}
          </button>
          <BlockIcon theme={theme} />
          <span className="min-w-0 flex-1 truncate text-[11px] font-black text-[#fff4c9]">
            {block.name}
          </span>
          <span className="pr-1 text-[8px] font-black text-[#84aaff]">DRAG</span>
        </div>
      )}
    </Draggable>
  );
}

function BlockIcon({ theme }: { theme: (typeof EJAY_TRACK)[AudioBlock["track"]] }) {
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-2 shadow-inner ${theme.iconBg} ${theme.iconBorder}`}
    >
      <Disc3 className="h-4 w-4 text-white/90" />
    </div>
  );
}
