/**
 * Generates a completely self-contained single-file hashgraph.html
 * with Sun/Moon theme toggler (Dark & Light modes), zero dependencies, no emojis,
 * direct numeric node input, Follow/Un-Follow, and high-speed simulation.
 */
export function generateStandaloneHtml(initialNodeCount = 5): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hashgraph DAG Explorer</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace, sans-serif;
    }
    :root {
      --bg: #080a0f;
      --header-bg: #0b0e14;
      --border: #181d29;
      --text: #f1f5f9;
      --subtext: #94a3b8;
      --btn-bg: #121622;
      --btn-border: #1e2638;
      --btn-hover: #182030;
      --accent: #22d3ee;
      --grid: #141824;
      --lane: #1e2638;
      --sp-line: #334155;
      --node-stroke: #06b6d4;
      --node-fill: #0f1420;
      --node-text: #f8fafc;
      --event-pending: #38bdf8;
      --event-consensus: #10b981;
    }
    body.light-theme {
      --bg: #ffffff;
      --header-bg: #f8fafc;
      --border: #e2e8f0;
      --text: #0f172a;
      --subtext: #64748b;
      --btn-bg: #ffffff;
      --btn-border: #cbd5e1;
      --btn-hover: #f1f5f9;
      --accent: #059669;
      --grid: #f1f5f9;
      --lane: #475569;
      --sp-line: #94a3b8;
      --node-stroke: #2d6a4f;
      --node-fill: #ffffff;
      --node-text: #1e293b;
      --event-pending: #52b788;
      --event-consensus: #2d6a4f;
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
      transition: background-color 0.2s, color 0.2s;
    }
    header {
      background: var(--header-bg);
      border-bottom: 1px solid var(--border);
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      z-index: 10;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .input-node-group {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--btn-bg);
      border: 1px solid var(--btn-border);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      color: var(--subtext);
    }
    input[type=number] {
      width: 44px;
      background: var(--bg);
      border: 1px solid var(--btn-border);
      color: var(--text);
      border-radius: 4px;
      padding: 2px 4px;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      outline: none;
    }
    button {
      background: var(--btn-bg);
      border: 1px solid var(--btn-border);
      color: var(--text);
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
    }
    button:hover {
      background: var(--btn-hover);
    }
    button.primary {
      background: #059669;
      border-color: #047857;
      color: #ffffff;
    }
    button.active-follow {
      background: rgba(8, 145, 178, 0.15);
      border-color: var(--accent);
      color: var(--accent);
    }
    .theme-toggle-btn {
      padding: 5px 8px;
      font-size: 14px;
      line-height: 1;
    }
    .speed-control {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--subtext);
      background: var(--btn-bg);
      border: 1px solid var(--btn-border);
      padding: 4px 8px;
      border-radius: 6px;
    }
    input[type=range] {
      accent-color: var(--accent);
      cursor: pointer;
      width: 85px;
    }
    #canvas-container {
      flex: 1;
      position: relative;
      background: var(--bg);
      cursor: grab;
      overflow: hidden;
    }
    #canvas-container:active {
      cursor: grabbing;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    .zoom-hud {
      position: absolute;
      bottom: 14px;
      right: 14px;
      background: var(--header-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 3px;
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .zoom-btn {
      width: 26px;
      height: 26px;
      border: none;
      background: transparent;
      color: var(--subtext);
      font-size: 13px;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .zoom-btn:hover {
      background: var(--btn-hover);
      color: var(--text);
    }
    footer {
      background: var(--header-bg);
      border-top: 1px solid var(--border);
      padding: 6px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      font-family: monospace;
      color: var(--subtext);
      z-index: 10;
    }
    .status-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    #tooltip {
      position: absolute;
      display: none;
      background: var(--header-bg);
      color: var(--text);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 11px;
      border: 1px solid var(--border);
      pointer-events: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      z-index: 50;
      line-height: 1.4;
      max-width: 240px;
    }
  </style>
</head>
<body>

  <header>
    <div class="brand-section">
      <div class="brand-title">Hashgraph DAG</div>
    </div>

    <div class="controls">
      <!-- Sun / Moon Theme Toggle SVG Icon -->
      <button class="theme-toggle-btn" id="btn-theme" title="Toggle Theme" aria-label="Toggle Theme">
        <span id="theme-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        </span>
      </button>

      <div class="input-node-group">
        <span>Nodes:</span>
        <input type="number" id="input-nodes" min="2" max="26" value="${initialNodeCount}">
      </div>

      <button id="btn-play-pause" class="primary">
        <span id="play-text">Pause</span>
      </button>

      <button id="btn-step">
        Step
      </button>

      <button id="btn-reset">
        Reset
      </button>

      <button id="btn-follow" class="active-follow">
        Follow
      </button>

      <div class="speed-control">
        <span>Speed:</span>
        <input type="range" id="speed-slider" min="1" max="50" value="5">
        <span id="speed-display" style="font-weight: bold; width: 28px;">5x</span>
      </div>
    </div>
  </header>

  <div id="canvas-container">
    <canvas id="hashgraphCanvas"></canvas>
    <div id="tooltip"></div>

    <div class="zoom-hud">
      <button class="zoom-btn" id="btn-zoom-out">-</button>
      <span style="font-size: 11px; width: 34px; text-align: center;" id="zoom-label">100%</span>
      <button class="zoom-btn" id="btn-zoom-in">+</button>
      <button class="zoom-btn" id="btn-center">[]</button>
    </div>
  </div>

  <footer>
    <div class="status-left">
      <div>network: <span style="font-weight: bold;">hashgraph-simulation</span></div>
      <div>peers: <span style="color: #06b6d4; font-weight: bold;" id="footer-peers">${initialNodeCount} nodes</span></div>
      <div>supermajority: <span style="font-weight: bold;" id="footer-supermaj">4/5 (&gt;2/3)</span></div>
      <div>events: <span style="font-weight: bold;" id="footer-events">5</span></div>
      <div>virtual voting: <span style="color: #10b981; font-weight: bold;" id="footer-consensus">0</span></div>
    </div>
    <div style="font-size: 10px;">Double click on the graph to re-center...</div>
  </footer>

  <script>
    const NODE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let nodeCount = ${initialNodeCount};
    let isPlaying = true;
    let speed = 5;
    let autoScroll = true;
    let isDark = true;

    let events = [];
    let eventsMap = new Map();
    let ancestorsMap = new Map();
    let latestEventByNode = [];
    let nextIndex = 0;
    let currentMaxX = 140;

    let cameraX = 0;
    let cameraY = 0;
    let zoom = 1.0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let hoveredEvent = null;

    let lastGossipTime = performance.now();

    const container = document.getElementById('canvas-container');
    const canvas = document.getElementById('hashgraphCanvas');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('tooltip');

    const laneHeight = 72;
    const topPadding = 75;
    const nodeCircleX = 75;

    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function getNodeY(nodeIndex) {
      return topPadding + nodeIndex * laneHeight;
    }

    function getSupermajority() {
      return Math.floor((2 * nodeCount) / 3) + 1;
    }

    function initSimulation() {
      events = [];
      eventsMap.clear();
      ancestorsMap.clear();
      latestEventByNode = new Array(nodeCount).fill(null);
      nextIndex = 0;
      currentMaxX = 140;
      cameraX = 0;
      cameraY = 0;

      for (let i = 0; i < nodeCount; i++) {
        const id = 'e_gen_' + i;
        const ev = {
          id: id,
          index: nextIndex++,
          creator: i,
          x: 160 + (i % 2 === 1 ? 20 : 0),
          y: getNodeY(i),
          selfParentId: null,
          otherParentId: null,
          senderNode: null,
          round: 1,
          isWitness: true,
          status: 'pending',
          createdAt: performance.now()
        };
        events.push(ev);
        eventsMap.set(id, ev);
        ancestorsMap.set(id, new Set([id]));
        latestEventByNode[i] = ev;
      }

      updateConsensus();
      updateCounters();
    }

    function createGossipEvent() {
      let sender = Math.floor(Math.random() * nodeCount);
      let receiver = Math.floor(Math.random() * nodeCount);
      while (receiver === sender && nodeCount > 1) {
        receiver = Math.floor(Math.random() * nodeCount);
      }

      const selfParent = latestEventByNode[receiver];
      const otherParent = latestEventByNode[sender];
      if (!selfParent || !otherParent) return;

      const id = 'e_' + nextIndex;
      currentMaxX += 52 + Math.floor(Math.random() * 18);

      const ancestors = new Set([id]);
      const selfAnc = ancestorsMap.get(selfParent.id);
      if (selfAnc) selfAnc.forEach(a => ancestors.add(a));
      const otherAnc = ancestorsMap.get(otherParent.id);
      if (otherAnc) otherAnc.forEach(a => ancestors.add(a));
      ancestorsMap.set(id, ancestors);

      const parentMaxRound = Math.max(selfParent.round, otherParent.round);

      const ev = {
        id: id,
        index: nextIndex++,
        creator: receiver,
        x: currentMaxX,
        y: getNodeY(receiver),
        selfParentId: selfParent.id,
        otherParentId: otherParent.id,
        senderNode: sender,
        round: parentMaxRound,
        isWitness: false,
        status: 'pending',
        createdAt: performance.now()
      };

      events.push(ev);
      eventsMap.set(id, ev);
      latestEventByNode[receiver] = ev;

      updateConsensus();
      updateCounters();
    }

    function updateConsensus() {
      const frontierX = currentMaxX;
      const supermaj = getSupermajority();

      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (ev.status === 'consensus') continue;

        let reachedNodes = 0;
        for (let n = 0; n < nodeCount; n++) {
          const latest = latestEventByNode[n];
          if (latest) {
            const anc = ancestorsMap.get(latest.id);
            if (anc && anc.has(ev.id)) reachedNodes++;
          }
        }

        const dist = frontierX - ev.x;
        if (reachedNodes >= supermaj && dist > 180) {
          ev.status = 'consensus';
        }
      }
    }

    function updateCounters() {
      document.getElementById('footer-events').textContent = events.length;
      const consensusCount = events.filter(e => e.status === 'consensus').length;
      document.getElementById('footer-consensus').textContent = consensusCount;
      document.getElementById('footer-peers').textContent = nodeCount + ' nodes';
      document.getElementById('footer-supermaj').textContent = getSupermajority() + '/' + nodeCount + ' (>2/3)';
    }

    function drawArrowhead(fromX, fromY, toX, toY, color) {
      const angle = Math.atan2(toY - fromY, toX - fromX);
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      const tipX = toX - Math.cos(angle) * 7;
      const tipY = toY - Math.sin(angle) * 7;
      const arrowSize = 10;

      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - arrowSize * Math.cos(angle - Math.PI / 6), tipY - arrowSize * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(tipX - arrowSize * Math.cos(angle + Math.PI / 6), tipY - arrowSize * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function render(timestamp) {
      if (isPlaying) {
        let interval = Math.max(16, Math.floor(1000 / speed));
        let batch = speed >= 35 ? 3 : (speed >= 20 ? 2 : 1);
        if (speed >= 35) interval = 20;

        if (timestamp - lastGossipTime > interval) {
          for (let b = 0; b < batch; b++) createGossipEvent();
          lastGossipTime = timestamp;
        }
      }

      const width = container.clientWidth;
      const height = container.clientHeight;

      if (autoScroll) {
        const targetX = Math.max(0, currentMaxX - (width / zoom) + 240);
        cameraX += (targetX - cameraX) * 0.08;
      }

      ctx.fillStyle = isDark ? '#080a0f' : '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Grid
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

      // World
      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(-cameraX, -cameraY);

      const maxBoardX = Math.max(currentMaxX + 500, width / zoom + cameraX + 300);

      // Lanes
      for (let i = 0; i < nodeCount; i++) {
        const y = getNodeY(i);
        ctx.beginPath();
        ctx.strokeStyle = isDark ? '#1e2638' : '#475569';
        ctx.lineWidth = 1.2;
        ctx.moveTo(nodeCircleX + 18, y);
        ctx.lineTo(maxBoardX, y);
        ctx.stroke();
      }

      // Self parent lines
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

      // Gossip curves
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
              ? (isConsensus ? '#10b981' : '#38bdf8')
              : (isConsensus ? '#2d6a4f' : '#40916c');

            ctx.beginPath();
            ctx.moveTo(op.x, op.y);
            ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, ev.x, ev.y);
            ctx.strokeStyle = curveColor;
            ctx.lineWidth = 1.8;
            ctx.stroke();

            const tPrev = 0.82;
            const prevX = Math.pow(1 - tPrev, 3) * op.x + 3 * Math.pow(1 - tPrev, 2) * tPrev * cpX1 + 3 * (1 - tPrev) * Math.pow(tPrev, 2) * cpX2 + Math.pow(tPrev, 3) * ev.x;
            const prevY = Math.pow(1 - tPrev, 3) * op.y + 3 * Math.pow(1 - tPrev, 2) * tPrev * cpY1 + 3 * (1 - tPrev) * Math.pow(tPrev, 2) * cpY2 + Math.pow(tPrev, 3) * ev.y;

            drawArrowhead(prevX, prevY, ev.x, ev.y, curveColor);
          }
        }
      }

      // Event dots
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        const isConsensus = ev.status === 'consensus';
        const isHovered = hoveredEvent && hoveredEvent.id === ev.id;
        const radius = isHovered ? 9 : 7;

        if (isConsensus) {
          ctx.beginPath();
          ctx.arc(ev.x, ev.y, radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(45, 106, 79, 0.22)';
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(ev.x, ev.y, radius + 2, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(82, 183, 136, 0.2)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(ev.x, ev.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? (isConsensus ? '#10b981' : '#38bdf8')
          : (isConsensus ? '#2d6a4f' : '#52b788');
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // Node badges
      for (let i = 0; i < nodeCount; i++) {
        const y = getNodeY(i);
        const radius = 17;

        ctx.beginPath();
        ctx.arc(nodeCircleX, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#0f1420' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#06b6d4' : '#2d6a4f';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isDark ? '#f8fafc' : '#1e293b';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(NODE_LETTERS[i], nodeCircleX, y + 0.5);
      }

      ctx.restore();
      requestAnimationFrame(render);
    }

    // Toggle Dark / Light Theme
    const sunSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
    const moonSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

    document.getElementById('btn-theme').addEventListener('click', () => {
      isDark = !isDark;
      if (isDark) {
        document.body.classList.remove('light-theme');
        document.getElementById('theme-icon').innerHTML = sunSvg;
      } else {
        document.body.classList.add('light-theme');
        document.getElementById('theme-icon').innerHTML = moonSvg;
      }
    });

    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      autoScroll = false;
      document.getElementById('btn-follow').classList.remove('active-follow');
      document.getElementById('btn-follow').textContent = 'Un-Follow';
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = (e.clientX - dragStartX) / zoom;
        const dy = (e.clientY - dragStartY) / zoom;
        cameraX -= dx;
        cameraY -= dy;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = mouseX / zoom + cameraX;
      const worldY = mouseY / zoom + cameraY;

      let found = null;
      for (let i = events.length - 1; i >= 0; i--) {
        const ev = events[i];
        if (Math.hypot(ev.x - worldX, ev.y - worldY) <= 14) {
          found = ev;
          break;
        }
      }
      hoveredEvent = found;

      if (found) {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top = (e.clientY + 14) + 'px';
        tooltip.innerHTML = '<strong>' + found.id + '</strong><br>Node: (' + NODE_LETTERS[found.creator] + ')<br>Status: ' + (found.status === 'consensus' ? 'Consensus Final' : 'Gossip In-Flight');
      } else {
        tooltip.style.display = 'none';
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    container.addEventListener('dblclick', () => {
      cameraX = 0;
      cameraY = 0;
      zoom = 1.0;
      autoScroll = true;
      document.getElementById('btn-follow').classList.add('active-follow');
      document.getElementById('btn-follow').textContent = 'Follow';
    });

    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      autoScroll = false;
      document.getElementById('btn-follow').classList.remove('active-follow');
      document.getElementById('btn-follow').textContent = 'Un-Follow';

      if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        zoom = Math.max(0.3, Math.min(3.0, zoom * factor));
        document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
      } else {
        cameraX += e.deltaX / zoom;
        cameraY += e.deltaY / zoom;
      }
    });

    const inputNodes = document.getElementById('input-nodes');
    inputNodes.addEventListener('change', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val) || val < 2) val = 2;
      if (val > 26) val = 26;
      nodeCount = val;
      e.target.value = val;
      initSimulation();
      autoScroll = true;
      document.getElementById('btn-follow').classList.add('active-follow');
      document.getElementById('btn-follow').textContent = 'Follow';
    });

    document.getElementById('btn-play-pause').addEventListener('click', () => {
      isPlaying = !isPlaying;
      document.getElementById('play-text').textContent = isPlaying ? 'Pause' : 'Resume';
      if (isPlaying) {
        autoScroll = true;
        document.getElementById('btn-follow').classList.add('active-follow');
        document.getElementById('btn-follow').textContent = 'Follow';
      }
    });

    document.getElementById('btn-step').addEventListener('click', () => {
      isPlaying = false;
      document.getElementById('play-text').textContent = 'Resume';
      createGossipEvent();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      initSimulation();
      autoScroll = true;
      document.getElementById('btn-follow').classList.add('active-follow');
      document.getElementById('btn-follow').textContent = 'Follow';
    });

    document.getElementById('btn-follow').addEventListener('click', () => {
      autoScroll = !autoScroll;
      const btn = document.getElementById('btn-follow');
      if (autoScroll) {
        btn.classList.add('active-follow');
        btn.textContent = 'Follow';
      } else {
        btn.classList.remove('active-follow');
        btn.textContent = 'Un-Follow';
      }
    });

    document.getElementById('speed-slider').addEventListener('input', (e) => {
      speed = parseInt(e.target.value);
      document.getElementById('speed-display').textContent = speed + 'x';
    });

    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      zoom = Math.min(3.0, zoom * 1.25);
      document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
    });

    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      zoom = Math.max(0.3, zoom / 1.25);
      document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
    });

    document.getElementById('btn-center').addEventListener('click', () => {
      cameraX = 0;
      cameraY = 0;
      zoom = 1.0;
      document.getElementById('zoom-label').textContent = '100%';
      autoScroll = true;
      document.getElementById('btn-follow').classList.add('active-follow');
      document.getElementById('btn-follow').textContent = 'Follow';
    });

    initSimulation();
    requestAnimationFrame(render);
  </script>
</body>
</html>`;
}
