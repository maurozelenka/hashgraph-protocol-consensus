import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HashgraphEvent, NodeInfo, ThemeMode } from '../types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface HashgraphCanvasProps {
  theme: ThemeMode;
  nodes: NodeInfo[];
  events: HashgraphEvent[];
  eventsMap: Map<string, HashgraphEvent>;
  ancestorsMap: Map<string, Set<string>>;
  currentMaxX: number;
  selectedEventId: string | null;
  onSelectEvent: (event: HashgraphEvent | null) => void;
  autoScroll: boolean;
  setAutoScroll: (auto: boolean) => void;
}

export const HashgraphCanvas: React.FC<HashgraphCanvasProps> = ({
  theme,
  nodes,
  events,
  eventsMap,
  ancestorsMap,
  currentMaxX,
  selectedEventId,
  onSelectEvent,
  autoScroll,
  setAutoScroll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 2D Whiteboard Camera (Pan X/Y + Zoom)
  const cameraXRef = useRef<number>(0);
  const cameraYRef = useRef<number>(0);
  const targetCameraXRef = useRef<number>(0);
  const zoomRef = useRef<number>(1);

  // Dragging state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoveredEventRef = useRef<HashgraphEvent | null>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    event: HashgraphEvent | null;
  }>({ visible: false, x: 0, y: 0, event: null });

  const laneHeight = 72;
  const topPadding = 75;
  const nodeCircleX = 75;

  const isDark = theme === 'dark';

  const getNodeY = useCallback(
    (nodeIndex: number) => {
      return topPadding + nodeIndex * laneHeight;
    },
    [laneHeight, topPadding]
  );

  const handleResetView = useCallback(() => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight;
    const totalGraphHeight = topPadding + (nodes.length - 1) * laneHeight;
    cameraYRef.current = Math.max(0, (totalGraphHeight - height) / 2 + 20);
    cameraXRef.current = 0;
    zoomRef.current = 1;
    setCurrentZoom(1);
    setAutoScroll(true);
  }, [nodes.length, laneHeight, topPadding, setAutoScroll]);

  const handleDoubleClick = () => {
    handleResetView();
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    targetCameraXRef.current = Math.max(0, currentMaxX - width / zoomRef.current + 240);
  }, [currentMaxX]);

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

  const drawArrowhead = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    arrowSize = 11,
    color = '#22d3ee'
  ) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    const tipX = toX - Math.cos(angle) * 7;
    const tipY = toY - Math.sin(angle) * 7;

    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - arrowSize * Math.cos(angle - Math.PI / 6),
      tipY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      tipX - arrowSize * Math.cos(angle + Math.PI / 6),
      tipY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    let animationId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        animationId = requestAnimationFrame(render);
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

      const cameraX = cameraXRef.current;
      const cameraY = cameraYRef.current;
      const zoom = zoomRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background color based on active theme
      ctx.fillStyle = isDark ? '#080a0f' : '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 1. Technical Grid
      ctx.save();
      ctx.strokeStyle = isDark ? '#141824' : '#f1f5f9';
      ctx.lineWidth = 1;
      const gridSize = 40 * zoom;
      const offsetX = -(cameraX * zoom % gridSize);
      const offsetY = -(cameraY * zoom % gridSize);

      for (let x = offsetX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 2. World Coordinate Space
      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(-cameraX, -cameraY);

      const maxBoardX = Math.max(currentMaxX + 500, width / zoom + cameraX + 300);

      // 3. Lane Lines extending from Node circles
      for (let i = 0; i < nodes.length; i++) {
        const y = getNodeY(i);
        ctx.beginPath();
        ctx.strokeStyle = isDark ? '#1e2638' : '#475569';
        ctx.lineWidth = 1.2;
        ctx.moveTo(nodeCircleX + 18, y);
        ctx.lineTo(maxBoardX, y);
        ctx.stroke();
      }

      // 4. Self-parent horizontal connecting lines
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (ev.selfParentId) {
          const sp = eventsMap.get(ev.selfParentId);
          if (sp) {
            ctx.beginPath();
            ctx.strokeStyle = isDark ? '#334155' : '#94a3b8';
            ctx.lineWidth = 1.3;
            ctx.moveTo(sp.x, sp.y);
            ctx.lineTo(ev.x, ev.y);
            ctx.stroke();
          }
        }
      }

      // 5. Gossip Bézier Curves with glowing trails & arrowheads
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (ev.otherParentId) {
          const op = eventsMap.get(ev.otherParentId);
          if (op) {
            const dx = ev.x - op.x;
            const cpX1 = op.x + dx * 0.42;
            const cpY1 = op.y;
            const cpX2 = op.x + dx * 0.58;
            const cpY2 = ev.y;

            const isConsensus = ev.status === 'consensus';
            const curveColor = isDark
              ? isConsensus
                ? '#10b981'
                : '#38bdf8'
              : isConsensus
              ? '#2d6a4f'
              : '#40916c';

            if (isDark) {
              // Glow in dark mode
              ctx.beginPath();
              ctx.moveTo(op.x, op.y);
              ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, ev.x, ev.y);
              ctx.strokeStyle = isConsensus
                ? 'rgba(16, 185, 129, 0.25)'
                : 'rgba(56, 189, 248, 0.25)';
              ctx.lineWidth = 3.5;
              ctx.stroke();
            }

            // Core line
            ctx.beginPath();
            ctx.moveTo(op.x, op.y);
            ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, ev.x, ev.y);
            ctx.strokeStyle = curveColor;
            ctx.lineWidth = 1.8;
            ctx.stroke();

            // Tangent for arrowhead
            const tPrev = 0.82;
            const prevX =
              Math.pow(1 - tPrev, 3) * op.x +
              3 * Math.pow(1 - tPrev, 2) * tPrev * cpX1 +
              3 * (1 - tPrev) * Math.pow(tPrev, 2) * cpX2 +
              Math.pow(tPrev, 3) * ev.x;
            const prevY =
              Math.pow(1 - tPrev, 3) * op.y +
              3 * Math.pow(1 - tPrev, 2) * tPrev * cpY1 +
              3 * (1 - tPrev) * Math.pow(tPrev, 2) * cpY2 +
              Math.pow(tPrev, 3) * ev.y;

            drawArrowhead(ctx, prevX, prevY, ev.x, ev.y, 11, curveColor);
          }
        }
      }

      // 6. Draw Events
      const hovered = hoveredEventRef.current;

      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        const isHovered = hovered && hovered.id === ev.id;
        const isSelected = selectedEventId === ev.id;
        const isConsensus = ev.status === 'consensus';

        let radius = 7;
        if (isSelected) radius = 10;
        else if (isHovered) radius = 9;

        if (isConsensus) {
          ctx.beginPath();
          ctx.arc(ev.x, ev.y, radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? 'rgba(16, 185, 129, 0.35)'
            : 'rgba(45, 106, 79, 0.22)';
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(ev.x, ev.y, radius + 2, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? 'rgba(56, 189, 248, 0.25)'
            : 'rgba(82, 183, 136, 0.2)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(ev.x, ev.y, radius, 0, Math.PI * 2);

        if (isConsensus) {
          ctx.fillStyle = isDark ? '#10b981' : '#2d6a4f';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        } else {
          ctx.fillStyle = isDark ? '#38bdf8' : '#52b788';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }

      // 7. Node badges (A), (B), (C)... on lane origins
      for (let i = 0; i < nodes.length; i++) {
        const y = getNodeY(i);
        const node = nodes[i];
        const radius = 17;

        ctx.beginPath();
        ctx.arc(nodeCircleX, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#0f1420' : '#ffffff';
        ctx.fill();

        ctx.strokeStyle = isDark ? '#06b6d4' : '#2d6a4f';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.fillStyle = isDark ? '#f8fafc' : '#1e293b';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, nodeCircleX, y + 0.5);
      }

      ctx.restore();
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [
    theme,
    isDark,
    nodes,
    events,
    eventsMap,
    ancestorsMap,
    autoScroll,
    selectedEventId,
    laneHeight,
    topPadding,
    getNodeY,
    currentMaxX,
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

    let found: HashgraphEvent | null = null;
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

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setAutoScroll(false);

    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(0.3, Math.min(3.0, zoomRef.current * factor));
      zoomRef.current = newZoom;
      setCurrentZoom(newZoom);
    } else {
      cameraXRef.current += e.deltaX / zoomRef.current;
      cameraYRef.current += e.deltaY / zoomRef.current;
    }
  };

  const zoomIn = () => {
    const newZoom = Math.min(3.0, zoomRef.current * 1.25);
    zoomRef.current = newZoom;
    setCurrentZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(0.3, zoomRef.current / 1.25);
    zoomRef.current = newZoom;
    setCurrentZoom(newZoom);
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

      {/* Floating Zoom Controls in corner */}
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

        <div
          className={`w-px h-4 mx-0.5 ${
            isDark ? 'bg-[#1e2638]' : 'bg-slate-200'
          }`}
        />

        <button
          onClick={handleResetView}
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

      {/* Tooltip on hover */}
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
