"use client";

import type { DropResult } from "@hello-pangea/dnd";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAiDropHint } from "@/lib/aiDropHints";
import { disposeAudioEngine, getAudioEngine } from "@/lib/audioEngine";
import {
  createEmptyGrid,
  getBlockById,
  getTrackIndex,
  matchAiGrid,
} from "@/lib/constants";
import { parseCellDroppableId, parseDraggableSource } from "@/lib/dndIds";
import type {
  AiDropHint,
  AudioBlock,
  GameFeedback,
  GridState,
  RecordingPhase,
  TransportState,
} from "@/lib/types";

export function useSequencer() {
  const [grid, setGrid] = useState<GridState>(createEmptyGrid);
  const [transportState, setTransportState] = useState<TransportState>("stopped");
  const [playheadColumn, setPlayheadColumn] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHint, setAiHint] = useState<AiDropHint>(null);
  const [recordingPhase, setRecordingPhase] = useState<RecordingPhase>("idle");
  const [countInBeat, setCountInBeat] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [mixOptimizing, setMixOptimizing] = useState(false);
  const [mixOptimized, setMixOptimized] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<GameFeedback>(null);

  const gridRef = useRef(grid);
  const engineRef = useRef(getAudioEngine());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  gridRef.current = grid;

  useEffect(() => {
    const engine = engineRef.current;
    engine.setPlayheadCallback(setPlayheadColumn);
    engine.setReadyCallback(setIsAudioReady);
    engine.init().catch(() => setIsAudioReady(true));

    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      disposeAudioEngine();
    };
  }, []);

  const showFeedback = useCallback((next: Omit<NonNullable<GameFeedback>, "id">) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback({ ...next, id: Date.now() });
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 1600);
  }, []);

  useEffect(() => {
    engineRef.current.syncGrid(grid);
  }, [grid]);

  const play = useCallback(async () => {
    await engineRef.current.ensureStarted();
    await engineRef.current.play(gridRef.current);
    setTransportState("playing");
  }, []);

  const pause = useCallback(() => {
    engineRef.current.pause();
    setTransportState("paused");
  }, []);

  const stop = useCallback(() => {
    engineRef.current.stop();
    setTransportState("stopped");
    setPlayheadColumn(0);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (transportState === "playing") {
      pause();
    } else {
      await play();
    }
  }, [transportState, play, pause]);

  const previewBlock = useCallback(async (block: AudioBlock) => {
    await engineRef.current.previewBlock(block.id);
  }, []);

  const clearSlot = useCallback((rowIndex: number, colIndex: number) => {
    setGrid((prev) => {
      if (!prev[rowIndex][colIndex].blockId) return prev;
      const next = prev.map((row) => row.map((slot) => ({ ...slot })));
      next[rowIndex][colIndex].blockId = null;
      return next;
    });
  }, []);

  const handleDragStart = useCallback(
    (draggableId: string) => {
      const source = parseDraggableSource(draggableId);
      if (!source) return;
      const blockId =
        source.type === "library"
          ? source.blockId
          : gridRef.current[source.row!][source.col!].blockId;
      if (blockId) {
        setAiHint(getAiDropHint(blockId, gridRef.current));
      }
    },
    []
  );

  const handleDragEnd = useCallback((result: DropResult) => {
    setAiHint(null);
    const { source, destination, draggableId } = result;
    if (!destination) {
      showFeedback({ kind: "invalid", message: "Slip klodsen på en tom plads i den rigtige række" });
      return;
    }

    const destCell = parseCellDroppableId(destination.droppableId);
    if (!destCell) {
      showFeedback({ kind: "invalid", message: "Det er ikke en sequencer-plads" });
      return;
    }

    const dragSource = parseDraggableSource(draggableId);
    if (!dragSource) {
      showFeedback({ kind: "invalid", message: "Ukendt klods", row: destCell.row, col: destCell.col });
      return;
    }

    setGrid((prev) => {
      const next = prev.map((row) => row.map((slot) => ({ ...slot })));

      let blockId: string | null = null;
      let fromRow: number | null = null;
      let fromCol: number | null = null;

      if (dragSource.type === "library" && dragSource.blockId) {
        blockId = dragSource.blockId;
      } else if (dragSource.type === "grid") {
        fromRow = dragSource.row!;
        fromCol = dragSource.col!;
        blockId = prev[fromRow][fromCol].blockId;
        if (!blockId) {
          showFeedback({ kind: "invalid", message: "Tom klods", row: destCell.row, col: destCell.col });
          return prev;
        }
      }

      if (!blockId) {
        showFeedback({ kind: "invalid", message: "Tom klods", row: destCell.row, col: destCell.col });
        return prev;
      }

      const block = getBlockById(blockId);
      if (!block) {
        showFeedback({ kind: "invalid", message: "Klodsen findes ikke", row: destCell.row, col: destCell.col });
        return prev;
      }

      const targetRow = destCell.row;
      if (getTrackIndex(block.track) !== targetRow) {
        showFeedback({
          kind: "invalid",
          message: `${block.name} passer kun på ${block.track}-rækken`,
          row: targetRow,
          col: destCell.col,
        });
        return prev;
      }

      if (fromRow !== null && fromCol !== null) {
        if (fromRow === targetRow && fromCol === destCell.col) return prev;
        next[fromRow][fromCol].blockId = null;
      }

      next[targetRow][destCell.col].blockId = blockId;
      showFeedback({
        kind: "placed",
        message: `Nice! ${block.name} er lagt på block ${destCell.col + 1}`,
        row: targetRow,
        col: destCell.col,
      });
      return next;
    });
  }, [showFeedback]);

  const runAiPrompt = useCallback(
    (prompt: string) => {
      if (!prompt.trim() || aiLoading) return;
      setAiLoading(true);
      showFeedback({ kind: "ai", message: "AI DJ scanner dine loops..." });
      setTimeout(() => {
        setGrid(matchAiGrid(prompt));
        showFeedback({ kind: "ai", message: "Beat bygget! Tryk play." });
        setAiLoading(false);
      }, 1500);
    },
    [aiLoading, showFeedback]
  );

  const getSlotLabel = useCallback((blockId: string | null) => {
    if (!blockId) return null;
    return getBlockById(blockId)?.name ?? blockId;
  }, []);

  const startRecording = useCallback(async () => {
    if (recordingPhase !== "idle" && recordingPhase !== "recorded") return;
    setRecordError(null);
    setRecordingPhase("counting");
    setCountInBeat(1);
    showFeedback({ kind: "recording", message: "Gør dig klar: 1, 2, 3, 4..." });

    const beatMs = (60 / 100) * 1000;

    for (let beat = 2; beat <= 4; beat++) {
      await new Promise((r) => setTimeout(r, beatMs));
      setCountInBeat(beat);
    }

    await new Promise((r) => setTimeout(r, beatMs));

    try {
      setRecordingPhase("recording");
      setCountInBeat(0);
      await engineRef.current.startRecordingSession(gridRef.current);
      setRecordingPhase("recorded");
      setHasRecording(engineRef.current.hasRecording());
      showFeedback({ kind: "recording", message: "Optagelse klar!" });
    } catch {
      setRecordError("Mikrofon blev afvist. Tillad adgang i browseren.");
      setRecordingPhase("idle");
      setCountInBeat(0);
      showFeedback({ kind: "invalid", message: "Mikrofon adgang blev afvist" });
    }
  }, [recordingPhase, showFeedback]);

  const runAiMix = useCallback(async () => {
    if (!hasRecording || mixOptimizing) return;
    setMixOptimizing(true);
    showFeedback({ kind: "mix", message: "AI mixer vokalen..." });
    await new Promise((r) => setTimeout(r, 800));
    await engineRef.current.applyAiMix();
    setMixOptimized(true);
    setMixOptimizing(false);
    showFeedback({ kind: "mix", message: "Vokal mixet og klar" });
    if (transportState === "stopped") {
      await play();
    }
  }, [hasRecording, mixOptimizing, transportState, play, showFeedback]);

  return {
    grid,
    transportState,
    playheadColumn,
    isAudioReady,
    aiLoading,
    aiHint,
    feedback,
    recordingPhase,
    countInBeat,
    hasRecording,
    mixOptimizing,
    mixOptimized,
    recordError,
    togglePlayPause,
    stop,
    previewBlock,
    clearSlot,
    handleDragStart,
    handleDragEnd,
    runAiPrompt,
    getSlotLabel,
    startRecording,
    runAiMix,
  };
}
