"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { AiPromptBar } from "@/components/AiPromptBar";
import { Header } from "@/components/Header";
import { LibrarySidebar } from "@/components/LibrarySidebar";
import { LiveRecordStrip } from "@/components/LiveRecordStrip";
import { TimelineRuler } from "@/components/TimelineRuler";
import { TransportPanel } from "@/components/TransportPanel";
import { WorkspaceGrid } from "@/components/WorkspaceGrid";
import { useSequencer } from "@/hooks/useSequencer";

export function SequencerApp() {
  const {
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
  } = useSequencer();

  return (
    <DragDropContext
      onDragStart={(start) => handleDragStart(start.draggableId)}
      onDragEnd={(result: DropResult) => handleDragEnd(result)}
    >
      <div className="ejay-chrome flex h-screen flex-col">
        <Header />
        {feedback && (
          <div className="pointer-events-none fixed left-1/2 top-12 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-xs ejay-status-bubble">
            {feedback.message}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
          <TimelineRuler playheadColumn={playheadColumn} />

          <div className="flex min-h-0 flex-1 gap-2">
            <main className="flex min-w-0 flex-1 flex-col">
              <WorkspaceGrid
                grid={grid}
                playheadColumn={playheadColumn}
                aiHint={aiHint}
                feedback={feedback}
                onCellClick={clearSlot}
                getSlotLabel={getSlotLabel}
              />
              <LiveRecordStrip
                recordingPhase={recordingPhase}
                countInBeat={countInBeat}
                hasRecording={hasRecording}
                mixOptimizing={mixOptimizing}
                mixOptimized={mixOptimized}
                recordError={recordError}
                onStartRecording={startRecording}
                onAiMix={runAiMix}
              />
            </main>
            <LibrarySidebar isAudioReady={isAudioReady} onPreviewBlock={previewBlock} />
          </div>

          <TransportPanel
            transportState={transportState}
            isAudioReady={isAudioReady}
            onTogglePlayPause={togglePlayPause}
            onStop={stop}
          />
        </div>

        <AiPromptBar loading={aiLoading} onSubmit={runAiPrompt} />
      </div>
    </DragDropContext>
  );
}
