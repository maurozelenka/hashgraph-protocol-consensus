import { HashgraphVertex, NodeIdentity } from '../core/types';
import { ColorScheme } from './Palette';

export interface ViewportTransform {
  cameraX: number;
  cameraY: number;
  zoom: number;
}

export class GraphRenderer {
  private readonly nodeCircleX = 75;

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    transform: ViewportTransform,
    palette: ColorScheme,
    nodes: NodeIdentity[],
    events: HashgraphVertex[],
    eventsMap: Map<string, HashgraphVertex>,
    currentMaxX: number,
    hoveredEventId: string | null,
    selectedEventId: string | null,
    getNodeY: (nodeIndex: number) => number
  ): void {
    const { cameraX, cameraY, zoom } = transform;

    // Clear and background
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, width, height);

    // Grid rendering
    this.drawGrid(ctx, width, height, cameraX, cameraY, zoom, palette.gridLine);

    // World coordinate space
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-cameraX, -cameraY);

    const worldVisibleWidth = width / zoom;
    const maxTrackX = Math.max(currentMaxX + 500, worldVisibleWidth + cameraX + 300);

    // 1. Lane Rails
    this.drawLaneTracks(ctx, nodes, getNodeY, this.nodeCircleX, maxTrackX, palette.laneTrack);

    // 2. Self-Parent Connectors
    this.drawSelfParentLines(ctx, events, eventsMap, palette.selfParentLine);

    // 3. Gossip Bézier Arcs with Directional Arrowheads
    this.drawGossipArcs(ctx, events, eventsMap, palette);

    // 4. Vertices
    this.drawVertices(
      ctx,
      events,
      hoveredEventId,
      selectedEventId,
      palette
    );

    // 5. Circled Node Markers
    this.drawNodeBadges(ctx, nodes, getNodeY, this.nodeCircleX, palette);

    ctx.restore();
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraX: number,
    cameraY: number,
    zoom: number,
    gridColor: string
  ): void {
    ctx.save();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    const gridSize = 40 * zoom;
    const startX = -(cameraX * zoom % gridSize);
    const startY = -(cameraY * zoom % gridSize);

    for (let x = startX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = startY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawLaneTracks(
    ctx: CanvasRenderingContext2D,
    nodes: NodeIdentity[],
    getNodeY: (index: number) => number,
    nodeCircleX: number,
    maxTrackX: number,
    trackColor: string
  ): void {
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 1.2;

    for (let i = 0; i < nodes.length; i++) {
      const y = getNodeY(i);
      ctx.beginPath();
      ctx.moveTo(nodeCircleX + 18, y);
      ctx.lineTo(maxTrackX, y);
      ctx.stroke();
    }
  }

  private drawSelfParentLines(
    ctx: CanvasRenderingContext2D,
    events: HashgraphVertex[],
    eventsMap: Map<string, HashgraphVertex>,
    lineColor: string
  ): void {
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.3;

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (ev.selfParentId) {
        const parent = eventsMap.get(ev.selfParentId);
        if (parent) {
          ctx.beginPath();
          ctx.moveTo(parent.x, parent.y);
          ctx.lineTo(ev.x, ev.y);
          ctx.stroke();
        }
      }
    }
  }

  private drawGossipArcs(
    ctx: CanvasRenderingContext2D,
    events: HashgraphVertex[],
    eventsMap: Map<string, HashgraphVertex>,
    palette: ColorScheme
  ): void {
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (!ev.otherParentId) continue;

      const parent = eventsMap.get(ev.otherParentId);
      if (!parent) continue;

      const dx = ev.x - parent.x;
      const cpX1 = parent.x + dx * 0.42;
      const cpY1 = parent.y;
      const cpX2 = parent.x + dx * 0.58;
      const cpY2 = ev.y;

      const isConsensus = ev.status === 'consensus';
      const color = isConsensus ? palette.gossipConsensusCurve : palette.gossipPendingCurve;

      ctx.beginPath();
      ctx.moveTo(parent.x, parent.y);
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, ev.x, ev.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Tangent vector approaching receiver vertex
      const tPrev = 0.82;
      const prevX =
        Math.pow(1 - tPrev, 3) * parent.x +
        3 * Math.pow(1 - tPrev, 2) * tPrev * cpX1 +
        3 * (1 - tPrev) * Math.pow(tPrev, 2) * cpX2 +
        Math.pow(tPrev, 3) * ev.x;
      const prevY =
        Math.pow(1 - tPrev, 3) * parent.y +
        3 * Math.pow(1 - tPrev, 2) * tPrev * cpY1 +
        3 * (1 - tPrev) * Math.pow(tPrev, 2) * cpY2 +
        Math.pow(tPrev, 3) * ev.y;

      this.drawArrowhead(ctx, prevX, prevY, ev.x, ev.y, 11, color);
    }
  }

  private drawArrowhead(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    size: number,
    color: string
  ): void {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();

    const tipX = toX - Math.cos(angle) * 7;
    const tipY = toY - Math.sin(angle) * 7;

    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - size * Math.cos(angle - Math.PI / 6),
      tipY - size * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      tipX - size * Math.cos(angle + Math.PI / 6),
      tipY - size * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawVertices(
    ctx: CanvasRenderingContext2D,
    events: HashgraphVertex[],
    hoveredEventId: string | null,
    selectedEventId: string | null,
    palette: ColorScheme
  ): void {
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const isHovered = hoveredEventId === ev.id;
      const isSelected = selectedEventId === ev.id;
      const isConsensus = ev.status === 'consensus';

      let radius = 7;
      if (isSelected) radius = 10;
      else if (isHovered) radius = 9;

      // Glow halo
      ctx.beginPath();
      ctx.arc(ev.x, ev.y, radius + (isConsensus ? 4 : 2), 0, Math.PI * 2);
      ctx.fillStyle = isConsensus ? palette.glowConsensus : palette.glowPending;
      ctx.fill();

      // Vertex Core
      ctx.beginPath();
      ctx.arc(ev.x, ev.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isConsensus ? palette.eventConsensusFill : palette.eventPendingFill;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }

  private drawNodeBadges(
    ctx: CanvasRenderingContext2D,
    nodes: NodeIdentity[],
    getNodeY: (index: number) => number,
    nodeCircleX: number,
    palette: ColorScheme
  ): void {
    const radius = 17;

    for (let i = 0; i < nodes.length; i++) {
      const y = getNodeY(i);

      ctx.beginPath();
      ctx.arc(nodeCircleX, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = palette.nodeCircleFill;
      ctx.fill();

      ctx.strokeStyle = palette.nodeCircleBorder;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.fillStyle = palette.nodeLetter;
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nodes[i].label, nodeCircleX, y + 0.5);
    }
  }
}
