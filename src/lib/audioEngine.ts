import * as Tone from "tone";
import {
  AUDIO_BLOCKS,
  BARS_PER_BLOCK,
  BLOCK_COUNT,
  BPM,
  TOTAL_BARS,
  getBlockById,
  TRACK_ORDER,
} from "./constants";
import type { GridState } from "./types";

type PlayerEntry = {
  player: Tone.Player;
  usesFallback: boolean;
};

type FallbackVoice = {
  output: Tone.Gain;
  triggerDrum?: () => void;
  triggerNote?: (note: string, duration: string) => void;
  triggerChord?: (notes: string[], duration: string) => void;
  dispose: () => void;
};

export class SequencerAudioEngine {
  private players = new Map<string, PlayerEntry>();
  private fallbacks = new Map<string, FallbackVoice>();
  private columnScheduleIds: number[] = [];
  private fallbackScheduleIds: number[] = [];
  private drawLoopAttached = false;
  private drawRafId: number | null = null;
  private previewStopId: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;
  private onPlayhead?: (column: number) => void;
  private onReadyChange?: (ready: boolean) => void;
  private loadingSet = new Set<string>();

  private mic: Tone.UserMedia | null = null;
  private recorder: Tone.Recorder | null = null;
  private recordedBuffer: AudioBuffer | null = null;
  private vocalPlayer: Tone.Player | null = null;
  private vocalEq: Tone.EQ3 | null = null;
  private vocalReverb: Tone.Reverb | null = null;
  private vocalDryGain: Tone.Gain | null = null;
  private vocalWetGain: Tone.Gain | null = null;
  private mixOptimized = false;
  private recordStopScheduleId: number | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    const transport = Tone.getTransport();
    transport.bpm.value = BPM;
    transport.loop = true;
    transport.loopStart = 0;
    transport.loopEnd = `${TOTAL_BARS}m`;

    await Promise.all(AUDIO_BLOCKS.map((block) => this.loadBlock(block.id, block.url)));
    this.initialized = true;
    this.notifyReady();
  }

  setPlayheadCallback(cb: (column: number) => void): void {
    this.onPlayhead = cb;
    this.attachDrawLoop();
  }

  setReadyCallback(cb: (ready: boolean) => void): void {
    this.onReadyChange = cb;
  }

  private notifyReady(): void {
    this.onReadyChange?.(this.loadingSet.size === 0);
  }

  private async loadBlock(id: string, url: string): Promise<void> {
    if (this.players.has(id)) return;

    this.loadingSet.add(id);
    this.notifyReady();

    const player = new Tone.Player({
      url,
      loop: true,
      fadeIn: 0.02,
      fadeOut: 0.05,
      onload: () => {
        this.loadingSet.delete(id);
        const entry = this.players.get(id);
        if (entry) entry.usesFallback = false;
        this.notifyReady();
      },
      onerror: () => {
        this.loadingSet.delete(id);
        const entry = this.players.get(id);
        if (entry) entry.usesFallback = true;
        if (!this.fallbacks.has(id)) {
          this.fallbacks.set(id, this.buildFallbackVoice(id));
        }
        this.notifyReady();
      },
    }).toDestination();

    player.volume.value = -3;
    this.players.set(id, { player, usesFallback: true });
  }

  private buildFallbackVoice(blockId: string): FallbackVoice {
    const block = getBlockById(blockId);
    const track = block?.track ?? "drums";
    const output = new Tone.Gain(0).toDestination();
    const disposers: Array<() => void> = [];

    if (track === "drums") {
      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.02,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.25, sustain: 0 },
      }).connect(output);
      const hat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1,
      }).connect(output);
      disposers.push(() => kick.dispose(), () => hat.dispose());
      return {
        output,
        triggerDrum: () => {
          kick.triggerAttackRelease("C1", "8n");
          hat.triggerAttackRelease("16n", Tone.now() + Tone.Time("8n").toSeconds());
        },
        dispose: () => {
          disposers.forEach((d) => d());
          output.dispose();
        },
      };
    } else if (track === "bass") {
      const synth = new Tone.MonoSynth({
        oscillator: { type: "sawtooth" },
        filter: { Q: 2, type: "lowpass", rolloff: -24 },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.6 },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.2,
          release: 0.4,
          baseFrequency: 80,
          octaves: 2,
        },
      }).connect(output);
      disposers.push(() => synth.dispose());
      return {
        output,
        triggerNote: (note, duration) => synth.triggerAttackRelease(note, duration),
        dispose: () => {
          disposers.forEach((d) => d());
          output.dispose();
        },
      };
    } else if (track === "synth") {
      const pad = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.3, decay: 0.4, sustain: 0.6, release: 1.2 },
      }).connect(output);
      disposers.push(() => pad.dispose());
      return {
        output,
        triggerChord: (notes, duration) => pad.triggerAttackRelease(notes, duration),
        dispose: () => {
          disposers.forEach((d) => d());
          output.dispose();
        },
      };
    } else {
      const pluck = new Tone.PluckSynth({
        attackNoise: 0.5,
        dampening: 2800,
        resonance: 0.92,
      }).connect(output);
      disposers.push(() => pluck.dispose());
      return {
        output,
        triggerNote: (note) => pluck.triggerAttack(note),
        dispose: () => {
          disposers.forEach((d) => d());
          output.dispose();
        },
      };
    }
  }

  private scheduleFallbackPattern(blockId: string, startTime: number, durationBars: number): void {
    const block = getBlockById(blockId);
    const track = block?.track ?? "drums";
    const voice = this.fallbacks.get(blockId);
    if (!voice) return;

    const endTime = startTime + Tone.Time(`${durationBars}m`).toSeconds();
    voice.output.gain.setValueAtTime(0.35, startTime);
    voice.output.gain.setValueAtTime(0, endTime);

    const step = Tone.Time("4n").toSeconds();
    let t = startTime;

    if (track === "bass") {
      const pattern = [
        ["A1", "2n"],
        ["C2", "2n"],
        ["E2", "2n"],
        ["G2", "2n"],
      ] as const;
      pattern.forEach(([note, dur], i) => {
        const time = startTime + i * Tone.Time("2n").toSeconds();
        if (time >= endTime) return;
        const id = Tone.getTransport().schedule(() => {
          this.triggerFallbackNote(blockId, note, dur);
        }, time);
        this.fallbackScheduleIds.push(id);
      });
    } else if (track === "synth") {
      const id = Tone.getTransport().schedule(() => {
        this.triggerFallbackChord(blockId, ["A3", "C4", "E4"], "1m");
      }, startTime);
      this.fallbackScheduleIds.push(id);
    } else if (track === "guitar") {
      ["A3", "E4", "G4", "A4", "C5", "E5"].forEach((note, i) => {
        const time = startTime + i * Tone.Time("8n").toSeconds();
        if (time >= endTime) return;
        const id = Tone.getTransport().schedule(() => {
          this.triggerFallbackNote(blockId, note, "8n");
        }, time);
        this.fallbackScheduleIds.push(id);
      });
    } else {
      for (; t < endTime; t += step) {
        const time = t;
        const id = Tone.getTransport().schedule(() => {
          this.triggerFallbackDrum(blockId);
        }, time);
        this.fallbackScheduleIds.push(id);
      }
    }
  }

  private triggerFallbackDrum(blockId: string): void {
    const voice = this.fallbacks.get(blockId);
    if (!voice || voice.output.gain.value < 0.01) return;
    voice.triggerDrum?.();
  }

  private triggerFallbackNote(blockId: string, note: string, duration: string): void {
    const voice = this.fallbacks.get(blockId);
    if (!voice || voice.output.gain.value < 0.01) return;
    voice.triggerNote?.(note, duration);
  }

  private triggerFallbackChord(blockId: string, notes: string[], duration: string): void {
    const voice = this.fallbacks.get(blockId);
    if (!voice || voice.output.gain.value < 0.01) return;
    voice.triggerChord?.(notes, duration);
  }

  private attachDrawLoop(): void {
    if (this.drawLoopAttached) return;
    this.drawLoopAttached = true;
    const tick = () => {
      if (!this.drawLoopAttached) return;
      if (Tone.getTransport().state === "started") {
        const bar = this.parseBarFromPosition(Tone.getTransport().position as string);
        const column = Math.min(BLOCK_COUNT - 1, Math.floor(bar / BARS_PER_BLOCK));
        this.onPlayhead?.(column);
      }
      this.drawRafId = requestAnimationFrame(tick);
    };
    this.drawRafId = requestAnimationFrame(tick);
  }

  private parseBarFromPosition(position: string): number {
    const bars = parseInt(position.split(":")[0] ?? "0", 10);
    return Number.isNaN(bars) ? 0 : bars;
  }

  async ensureStarted(): Promise<void> {
    await Tone.start();
    if (!this.initialized) await this.init();
  }

  syncGrid(grid: GridState): void {
    if (Tone.getTransport().state === "started") {
      this.rescheduleColumns(grid);
    }
  }

  private stopAllPlayers(): void {
    this.players.forEach((entry) => {
      if (!entry.usesFallback) {
        try {
          entry.player.unsync().stop();
        } catch {
          /* not started */
        }
      }
    });
    this.fallbacks.forEach((v) => {
      v.output.gain.value = 0;
    });
    this.clearFallbackSchedules();
  }

  private clearFallbackSchedules(): void {
    this.fallbackScheduleIds.forEach((id) => Tone.getTransport().clear(id));
    this.fallbackScheduleIds = [];
  }

  private triggerColumn(column: number, grid: GridState, time?: number): void {
    this.stopAllPlayers();
    this.onPlayhead?.(column);

    const startTime = time ?? Tone.getTransport().seconds;

    TRACK_ORDER.forEach((track, rowIndex) => {
      const blockId = grid[rowIndex]?.[column]?.blockId;
      if (!blockId) return;

      const entry = this.players.get(blockId);
      if (!entry) return;

      if (entry.usesFallback) {
        if (!this.fallbacks.has(blockId)) {
          this.fallbacks.set(blockId, this.buildFallbackVoice(blockId));
        }
        this.scheduleFallbackPattern(blockId, startTime, BARS_PER_BLOCK);
        return;
      }

      entry.player.loop = true;
      entry.player.sync().start(startTime);
    });
  }

  private clearColumnSchedules(): void {
    this.columnScheduleIds.forEach((id) => Tone.getTransport().clear(id));
    this.columnScheduleIds = [];
  }

  private rescheduleColumns(grid: GridState): void {
    this.clearColumnSchedules();
    this.scheduleColumns(grid);
  }

  private scheduleColumns(grid: GridState): void {
    for (let col = 0; col < BLOCK_COUNT; col++) {
      const barOffset = col * BARS_PER_BLOCK;
      const id = Tone.getTransport().schedule((time) => {
        this.triggerColumn(col, grid, time);
      }, `${barOffset}m`);
      this.columnScheduleIds.push(id);
    }
  }

  async play(grid: GridState): Promise<void> {
    await this.ensureStarted();
    this.clearColumnSchedules();
    this.scheduleColumns(grid);
    Tone.getTransport().position = 0;
    this.triggerColumn(0, grid, Tone.now());
    this.syncVocalPlayback();
    Tone.getTransport().start();
  }

  pause(): void {
    Tone.getTransport().pause();
    this.stopAllPlayers();
    this.vocalPlayer?.stop();
  }

  stop(): void {
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    this.clearColumnSchedules();
    this.stopAllPlayers();
    this.vocalPlayer?.stop();
    this.onPlayhead?.(0);
    if (this.recordStopScheduleId !== null) {
      Tone.getTransport().clear(this.recordStopScheduleId);
      this.recordStopScheduleId = null;
    }
  }

  async previewBlock(blockId: string): Promise<void> {
    await this.ensureStarted();
    this.cancelPreview();

    const block = getBlockById(blockId);
    if (!block) return;

    if (!this.players.has(blockId)) {
      await this.loadBlock(blockId, block.url);
    }

    const entry = this.players.get(blockId);
    if (!entry) return;

    if (entry.usesFallback) {
      if (!this.fallbacks.has(blockId)) {
        this.fallbacks.set(blockId, this.buildFallbackVoice(blockId));
      }
      const now = Tone.now();
      this.scheduleFallbackPattern(blockId, now, BARS_PER_BLOCK);
      this.previewStopId = setTimeout(() => {
        this.fallbacks.get(blockId)?.output.gain.setValueAtTime(0, Tone.now());
      }, Tone.Time(`${BARS_PER_BLOCK}m`).toSeconds() * 1000);
      return;
    }

    const now = Tone.now();
    const duration = Tone.Time(`${BARS_PER_BLOCK}m`).toSeconds();
    entry.player.loop = false;
    entry.player.sync().start(now);
    entry.player.stop(now + duration);
    this.previewStopId = setTimeout(() => {
      entry.player.loop = true;
    }, duration * 1000 + 50);
  }

  private cancelPreview(): void {
    if (this.previewStopId !== null) {
      clearTimeout(this.previewStopId);
      this.previewStopId = null;
    }
  }

  hasRecording(): boolean {
    return this.recordedBuffer !== null;
  }

  isMixOptimized(): boolean {
    return this.mixOptimized;
  }

  private async ensureVocalChain(): Promise<void> {
    if (this.vocalEq) return;

    this.vocalEq = new Tone.EQ3({ low: -4, mid: 2, high: 5 });
    this.vocalReverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
    await this.vocalReverb.generate();

    this.vocalDryGain = new Tone.Gain(1).toDestination();
    this.vocalWetGain = new Tone.Gain(0).connect(this.vocalReverb);
    this.vocalReverb.toDestination();

    this.vocalEq.connect(this.vocalDryGain);
    this.vocalEq.connect(this.vocalWetGain);
  }

  private async ensureMic(): Promise<void> {
    if (!this.mic) {
      this.mic = new Tone.UserMedia();
      this.recorder = new Tone.Recorder();
      this.mic.connect(this.recorder);
    }
    await this.mic.open();
  }

  async startRecordingSession(grid: GridState): Promise<void> {
    await this.ensureStarted();
    await this.ensureMic();
    await this.ensureVocalChain();

    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    this.clearColumnSchedules();
    this.stopAllPlayers();

    await this.recorder!.start();
    await this.play(grid);

    const durationSec = Tone.Time(`${TOTAL_BARS}m`).toSeconds();
    await new Promise<void>((resolve, reject) => {
      this.recordStopScheduleId = Tone.getTransport().schedule(() => {
        setTimeout(async () => {
          try {
            const recording = await this.recorder!.stop();
            const arrayBuffer = await recording.arrayBuffer();
            this.recordedBuffer = await Tone.getContext().decodeAudioData(arrayBuffer);
            this.mixOptimized = false;
            await this.setupVocalPlayer();
            this.recordStopScheduleId = null;
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 50);
      }, durationSec);
    });
  }

  private async setupVocalPlayer(): Promise<void> {
    if (!this.recordedBuffer) return;
    this.vocalPlayer?.dispose();
    this.vocalPlayer = new Tone.Player({ url: this.recordedBuffer }).connect(this.vocalEq!);
    this.vocalPlayer.loop = true;
    this.applyMixSettings();
  }

  private applyMixSettings(): void {
    if (!this.vocalEq || !this.vocalReverb || !this.vocalWetGain || !this.vocalDryGain) return;
    if (this.mixOptimized) {
      this.vocalEq.low.value = -6;
      this.vocalEq.mid.value = 3;
      this.vocalEq.high.value = 6;
      this.vocalReverb.wet.value = 0.28;
      this.vocalWetGain.gain.value = 0.35;
      this.vocalDryGain.gain.value = 0.85;
    } else {
      this.vocalEq.low.value = 0;
      this.vocalEq.mid.value = 0;
      this.vocalEq.high.value = 0;
      this.vocalReverb.wet.value = 0;
      this.vocalWetGain.gain.value = 0;
      this.vocalDryGain.gain.value = 1;
    }
  }

  private syncVocalPlayback(): void {
    if (!this.vocalPlayer || !this.recordedBuffer) return;
    try {
      this.vocalPlayer.unsync().stop();
    } catch {
      /* */
    }
    this.vocalPlayer.sync().start(0);
  }

  async applyAiMix(): Promise<void> {
    if (!this.recordedBuffer) return;
    this.mixOptimized = true;
    this.applyMixSettings();
    if (Tone.getTransport().state !== "started") {
      await this.ensureStarted();
    }
    this.syncVocalPlayback();
  }

  dispose(): void {
    this.stop();
    this.cancelPreview();
    this.drawLoopAttached = false;
    if (this.drawRafId !== null) {
      cancelAnimationFrame(this.drawRafId);
      this.drawRafId = null;
    }
    this.players.forEach((entry) => entry.player.dispose());
    this.players.clear();
    this.fallbacks.forEach((v) => v.dispose());
    this.fallbacks.clear();
    this.vocalPlayer?.dispose();
    this.vocalEq?.dispose();
    this.vocalReverb?.dispose();
    this.vocalDryGain?.dispose();
    this.vocalWetGain?.dispose();
    this.mic?.close();
    this.mic?.dispose();
    this.recorder?.dispose();
    this.initialized = false;
  }
}

let engineInstance: SequencerAudioEngine | null = null;

export function getAudioEngine(): SequencerAudioEngine {
  if (!engineInstance) engineInstance = new SequencerAudioEngine();
  return engineInstance;
}

export function disposeAudioEngine(): void {
  engineInstance?.dispose();
  engineInstance = null;
}
