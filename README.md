# MusikMakker

Block-baseret loop-studio med AI-workflow: byg beats med drag-and-drop, optag guitar/vokal i browseren, og test mock-AI (prompt + mix) uden backend.

## Funktioner

- **Loop-gitter** — 4 spor (trommer, bas, synth, guitar) × 4 blokke med magnetisk snap
- **Bibliotek** — klik for preview, træk klodser fra højre sidebar ind på spor
- **Global sync** — Tone.js Transport, playhead og synkron afspilning
- **AI-prompt** — *"Hvad vil du lave?"* fylder gitteret efter 1,5 s (mock presets)
- **AI drop-hints** — grøn forslagscelle under drag (fx bas der matcher trommer)
- **Optagelse** — count-in 1–2–3–4, mikrofon over beatet (én loop)
- **AI Clean & Optimize** — EQ + reverb på optagelsen med ét klik

## Kom i gang

```bash
npm install
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000). Tillad mikrofon når du tester Record.

Hvis siden fejler efter ændringer:

```bash
Remove-Item -Recurse -Force .next   # PowerShell
npm run dev
```

## Scripts

| Kommando      | Beskrivelse        |
|---------------|--------------------|
| `npm run dev` | Udviklingsserver   |
| `npm run build` | Production build |
| `npm run start` | Kør production   |

## Lyd-assets (valgfrit)

Placer korte loop-MP3'er i `public/audio/` med navne fra `src/lib/constants.ts` (fx `drums_1.mp3`). Uden filer bruger appen indbyggede synth-fallbacks.

## Stack

- Next.js 15 · React 19 · TypeScript
- [Tone.js](https://tonejs.github.io/) — transport, loops, optagelse, effekter
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) — drag-and-drop
- Tailwind CSS 4

## Licens

Privat projekt — til demo og konceptvalidering.
