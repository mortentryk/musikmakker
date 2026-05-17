"use client";

import { Music2 } from "lucide-react";
import { BPM, KEY_LABEL } from "@/lib/constants";

export function Header() {
  return (
    <header className="ejay-title-bar flex h-14 shrink-0 items-center justify-between gap-4 px-5">
      <div className="flex items-center gap-3">
        <div className="ejay-btn flex h-9 w-9 items-center justify-center rounded">
          <Music2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-black uppercase tracking-wide text-white">MusikMakker</h1>
          <p className="text-[10px] font-bold uppercase text-[#fff0b8]">eJay + AI song game</p>
        </div>
      </div>
      <div className="ejay-panel-label flex items-center gap-2 rounded px-3 py-1.5">
        <span>{BPM} BPM</span>
        <span>·</span>
        <span>Key {KEY_LABEL}</span>
      </div>
    </header>
  );
}
