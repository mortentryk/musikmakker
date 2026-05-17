"use client";

import { BLOCK_COUNT, BARS_PER_BLOCK } from "@/lib/constants";

type TimelineRulerProps = {
  playheadColumn: number;
};

export function TimelineRuler({ playheadColumn }: TimelineRulerProps) {
  const measures = BLOCK_COUNT * BARS_PER_BLOCK;

  return (
    <div className="mm-ruler flex h-6 shrink-0 items-stretch pl-[4.5rem] pr-56">
      {Array.from({ length: measures }, (_, i) => {
        const col = Math.floor(i / BARS_PER_BLOCK);
        const isPlayhead = col === playheadColumn;
        const isBarStart = i % BARS_PER_BLOCK === 0;
        return (
          <div
            key={i}
            className={`mm-ruler-tick flex flex-1 items-center justify-center ${
              isPlayhead ? "bg-emerald-500/20" : ""
            } ${isBarStart ? "border-l-2 border-[#6b4e12]" : ""}`}
          >
            <span className={isBarStart ? "opacity-100" : "opacity-50"}>{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}
