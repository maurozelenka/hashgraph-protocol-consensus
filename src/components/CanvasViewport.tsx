import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HashgraphVertex, NodeIdentity, ThemeMode } from '../core/types';
import { GraphRenderer } from '../canvas/GraphRenderer';
import { getPalette } from '../canvas/Palette';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface CanvasViewportProps {
  theme: ThemeMode;
  nodes: NodeIdentity[];
  events: HashgraphVertex[];
  eventsMap: Map<string, HashgraphVertex>;
  currentMaxX: number;
  selectedEventId: string | null;
  onSelectEvent: (event: HashgraphVertex | null) => void;
  autoScroll: boolean;
  setAutoScroll: (auto: boolean) => void;
  getNodeY: (nodeIndex: number) => number;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  theme,
  nodes,
  events,
  eventsMap,
  currentMaxX,
  selectedEventId,
  onSelectEvent,
  autoScroll,
  setAutoScroll,
  getNodeY,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GraphRenderer>(new GraphRenderer());

  const cameraXRef = useRef<number>(0);
  const cameraYRef = useRef<number>(0);
  const targetCameraXRef = useRef<number>(0);
  const zoomRef = useRef<number>(1);

  const isDraggingRef = useRef<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoveredEventRef = useRef<HashgraphVertex | null>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    event: HashgraphVertex | null;
  }>({ visible: false, x: 0, y: 0, event: null });

  const isDark = theme === 'dark';

  const resetView = useCallback(() => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight;
    const totalGraphHeight = 75 + (nodes.length - 1) * 72;
    cameraYRef.current = Math.max(0, (totalGraphHeight - height) / 2 + 20);
    cameraXRef.current = 0;
    zoomRef.current = 1;
    setCurrentZoom(1);
    setAutoScroll(true);
  }, [nodes.length, setAutoScroll]);

  // Handle frontier follow target
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    targetCameraXRef.current = Math.max(0, currentMaxX - width / zoomRef.current + 240);
  }, [currentMaxX]);

  // Canvas DPI resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Main rendering loop
  useEffect(() => {
    let frameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        frameId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (autoScroll) {
        cameraXRef.current += (targetCameraXRef.current - cameraXRef.current) * 0.08;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const palette = getPalette(theme);
      const transform = {
        cameraX: cameraXRef.current,
        cameraY: cameraYRef.current,
        zoom: zoomRef.current,
      };

      rendererRef.current.render(
        ctx,
        width,
        height,
        transform,
        palette,
        nodes,
        events,
        eventsMap,
        currentMaxX,
        hoveredEventRef.current ? hoveredEventRef.current.id : null,
        selectedEventId,
        getNodeY
      );

      ctx.restore();
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [
    theme,
    nodes,
    events,
    eventsMap,
    currentMaxX,
    selectedEventId,
    autoScroll,
    getNodeY,
  ]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    setAutoScroll(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    if (isDraggingRef.current) {
      const dx = (e.clientX - dragStartPosRef.current.x) / zoomRef.current;
      const dy = (e.clientY - dragStartPosRef.current.y) / zoomRef.current;

      cameraXRef.current -= dx;
      cameraYRef.current -= dy;

      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const rect = container.getBoundingClientRect();
    const mouseScreenX = e.clientX - rect.left;
    const mouseScreenY = e.clientY - rect.top;

    const worldX = mouseScreenX / zoomRef.current + cameraXRef.current;
    const worldY = mouseScreenY / zoomRef.current + cameraYRef.current;

    let found: HashgraphVertex | null = null;
    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i];
      if (Math.hypot(ev.x - worldX, ev.y - worldY) <= 14) {
        found = ev;
        break;
      }
    }

    hoveredEventRef.current = found;

    if (found) {
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        event: found,
      });
    } else {
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = () => {
    if (hoveredEventRef.current) {
      onSelectEvent(hoveredEventRef.current);
    } else {
      onSelectEvent(null);
    }
  };

  const handleDoubleClick = () => {
    resetView();
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setAutoScroll(false);

    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const nextZoom = Math.max(0.3, Math.min(3.0, zoomRef.current * factor));
      zoomRef.current = nextZoom;
      setCurrentZoom(nextZoom);
    } else {
      cameraXRef.current += e.deltaX / zoomRef.current;
      cameraYRef.current += e.deltaY / zoomRef.current;
    }
  };

  const zoomIn = () => {
    const next = Math.min(3.0, zoomRef.current * 1.25);
    zoomRef.current = next;
    setCurrentZoom(next);
  };

  const zoomOut = () => {
    const next = Math.max(0.3, zoomRef.current / 1.25);
    zoomRef.current = next;
    setCurrentZoom(next);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors duration-200 ${
        isDark ? 'bg-[#080a0f]' : 'bg-white'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Floating Viewport Controls */}
      <div
        className={`absolute bottom-5 right-5 z-20 flex items-center gap-1 backdrop-blur-md p-1.5 rounded-lg border shadow-lg transition-colors ${
          isDark
            ? 'bg-[#10141e]/90 border-[#1e2638]'
            : 'bg-white/90 border-slate-200'
        }`}
      >
        <button
          onClick={zoomOut}
          className={`p-1.5 rounded transition ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-[#1a2133]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span
          className={`text-[11px] font-mono font-semibold w-11 text-center ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          {Math.round(currentZoom * 100)}%
        </span>

        <button
          onClick={zoomIn}
          className={`p-1.5 rounded transition ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-[#1a2133]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className={`w-px h-4 mx-0.5 ${isDark ? 'bg-[#1e2638]' : 'bg-slate-200'}`} />

        <button
          onClick={resetView}
          className={`p-1.5 rounded transition ${
            isDark
              ? 'text-slate-400 hover:text-cyan-400 hover:bg-[#1a2133]'
              : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-100'
          }`}
          title="Center view on graph"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Hover Inspection Tooltip */}
      {tooltip.visible && tooltip.event && (
        <div
          className={`fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-lg text-xs shadow-2xl backdrop-blur-md border max-w-xs ${
            isDark
              ? 'bg-[#0e131f]/95 text-white border-[#1e293b]'
              : 'bg-slate-900/95 text-white border-slate-700'
          }`}
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y - 10}px` }}
        >
          <div className="flex items-center justify-between gap-3 mb-1 pb-1 border-b border-slate-700/60">
            <span className="font-mono font-bold text-cyan-400">{tooltip.event.id}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                tooltip.event.status === 'consensus'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                  : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
              }`}
            >
              {tooltip.event.status === 'consensus' ? 'Consensus Final' : 'Gossip In-Flight'}
            </span>
          </div>

          <div className="space-y-0.5 text-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Node:</span>
              <span className="font-semibold text-white">
                ({nodes[tooltip.event.creator]?.label || 'A'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Round:</span>
              <span className="font-mono text-slate-200">Round {tooltip.event.round}</span>
            </div>
            {tooltip.event.senderNode !== null && (
              <div className="flex justify-between">
                <span className="text-slate-400">Gossip From:</span>
                <span className="text-cyan-300 font-medium">
                  ({nodes[tooltip.event.senderNode]?.label})
                </span>
              </div>
            )}
            {tooltip.event.consensusOrder && (
              <div className="flex justify-between text-emerald-400 font-semibold pt-0.5 border-t border-slate-700/60">
                <span>Order:</span>
                <span>#{tooltip.event.consensusOrder}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
