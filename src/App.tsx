import React, { useState } from 'react';
import { useHashgraphSimulation } from './hooks/useHashgraphSimulation';
import { Header } from './components/Header';
import { CanvasViewport } from './components/CanvasViewport';
import { StatusBar } from './components/StatusBar';
import { EventInspector } from './components/EventInspector';
import { EducationalModal } from './components/EducationalModal';
import { PythonModal } from './components/PythonModal';
import { HashgraphVertex, ThemeMode } from './core/types';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<HashgraphVertex | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);

  const {
    engine,
    nodes,
    events,
    eventsMap,
    currentMaxX,
    nodeCount,
    setNodeCount,
    isPlaying,
    togglePlay,
    step,
    reset,
    speed,
    setSpeed,
    metrics,
    supermajority,
  } = useHashgraphSimulation(5);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleInspectAncestor = (ancestorId: string) => {
    const target = eventsMap.get(ancestorId);
    if (target) {
      setSelectedEvent(target);
    }
  };

  const handleDownloadHtml = () => {
    const a = document.createElement('a');
    a.href = '/hashgraph.html';
    a.download = 'hashgraph.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden select-none font-sans transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#080a0f] text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onStepGossip={step}
        onReset={reset}
        speed={speed}
        onSpeedChange={setSpeed}
        autoScroll={autoScroll}
        onToggleAutoScroll={() => setAutoScroll((prev) => !prev)}
        nodeCount={nodeCount}
        onNodeCountChange={setNodeCount}
        onOpenInfoModal={() => setIsInfoModalOpen(true)}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onDownloadHtml={handleDownloadHtml}
      />

      <div className="relative flex-1 w-full h-full overflow-hidden">
        <CanvasViewport
          theme={theme}
          nodes={nodes}
          events={events}
          eventsMap={eventsMap}
          currentMaxX={currentMaxX}
          selectedEventId={selectedEvent ? selectedEvent.id : null}
          onSelectEvent={setSelectedEvent}
          autoScroll={autoScroll}
          setAutoScroll={setAutoScroll}
          getNodeY={(index) => engine.getNodeY(index)}
        />
      </div>

      <StatusBar
        theme={theme}
        metrics={metrics}
        nodeCount={nodeCount}
        supermajority={supermajority}
      />

      <EventInspector
        theme={theme}
        event={selectedEvent}
        nodes={nodes}
        onClose={() => setSelectedEvent(null)}
        onInspectAncestor={handleInspectAncestor}
      />

      <EducationalModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

      <PythonModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />
    </div>
  );
}
