"use client";

import { waveformHeights } from "@/lib/ejayTheme";

export function WaveformBars({ seed }: { seed: string }) {
  const heights = waveformHeights(seed);
  return <Bars heights={heights} />;
}

function Bars({ heights }: { heights: number[] }) {
  return (
    <div className="ejay-wave-bars" aria-hidden>
      {heights.map((h, i) => (
        <span key={i} style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
