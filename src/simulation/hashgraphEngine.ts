import { ConsensusStatus, HashgraphEvent, NodeInfo } from '../types';

export const ALL_NODE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function getNodeLetter(index: number): string {
  if (index < 26) return ALL_NODE_LETTERS[index];
  return `N${index + 1}`;
}

export function generateNodes(count: number): NodeInfo[] {
  const safeCount = Math.max(2, Math.min(26, count));
  const palette = [
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#f59e0b', '#14b8a6', '#6366f1', '#d946ef', '#84cc16'
  ];

  return Array.from({ length: safeCount }, (_, i) => ({
    id: i,
    label: getNodeLetter(i),
    name: `Node ${getNodeLetter(i)}`,
    color: palette[i % palette.length],
    accentColor: '#10b981',
  }));
}

export function calculateSupermajority(nodeCount: number): number {
  return Math.floor((2 * nodeCount) / 3) + 1;
}

const SAMPLE_TRANSACTIONS = [
  'Transfer 12.5 HBAR',
  'Create Account 0.0.9841',
  'Digital Signature Verify',
  'Smart Contract Execution',
  'Token Mint: #892',
  'Oracle Consensus Update',
  'Identity Proof Verification',
  'Consensus Timestamp Log',
  'Delegated Validator Vote',
  'State Snapshot Verified',
];

export class HashgraphEngine {
  nodeCount: number = 5;
  nodes: NodeInfo[] = [];
  events: HashgraphEvent[] = [];
  eventsMap: Map<string, HashgraphEvent> = new Map();
  ancestorsMap: Map<string, Set<string>> = new Map();
  latestEventByNode: (HashgraphEvent | null)[] = [];
  nextEventIndex = 0;
  consensusCounter = 0;
  currentMaxX = 140;
  laneHeight = 70;
  topPadding = 80;

  constructor(nodeCount = 5, laneHeight = 70, topPadding = 80) {
    this.nodeCount = Math.max(2, Math.min(26, nodeCount));
    this.laneHeight = laneHeight;
    this.topPadding = topPadding;
    this.reset();
  }

  setNodeCount(count: number) {
    this.nodeCount = Math.max(2, Math.min(26, count));
    this.reset();
  }

  reset() {
    this.nodes = generateNodes(this.nodeCount);
    this.events = [];
    this.eventsMap.clear();
    this.ancestorsMap.clear();
    this.latestEventByNode = new Array(this.nodeCount).fill(null);
    this.nextEventIndex = 0;
    this.consensusCounter = 0;
    this.currentMaxX = 140;

    // Create Genesis Events for all nodes
    for (let i = 0; i < this.nodeCount; i++) {
      const genesisId = `e_gen_${i}`;
      const genesisEvent: HashgraphEvent = {
        id: genesisId,
        index: this.nextEventIndex++,
        creator: i,
        x: 160 + (i % 2 === 1 ? 20 : 0),
        y: this.getYForNode(i),
        selfParentId: null,
        otherParentId: null,
        senderNode: null,
        round: 1,
        isWitness: true,
        isFamous: false,
        status: 'pending',
        consensusOrder: null,
        consensusTimestamp: null,
        createdAt: Date.now(),
        birthTime: performance.now(),
        transactions: [`Genesis (${getNodeLetter(i)})`],
      };

      this.events.push(genesisEvent);
      this.eventsMap.set(genesisId, genesisEvent);
      this.ancestorsMap.set(genesisId, new Set([genesisId]));
      this.latestEventByNode[i] = genesisEvent;
    }

    this.updateConsensus();
  }

  getYForNode(nodeIndex: number): number {
    return this.topPadding + nodeIndex * this.laneHeight;
  }

  get supermajority(): number {
    return calculateSupermajority(this.nodeCount);
  }

  createGossipEvent(
    senderNode?: number,
    receiverNode?: number,
    customPayload?: string
  ): HashgraphEvent | null {
    let s = senderNode;
    let r = receiverNode;

    if (s === undefined || r === undefined) {
      s = Math.floor(Math.random() * this.nodeCount);
      r = Math.floor(Math.random() * this.nodeCount);
      while (r === s && this.nodeCount > 1) {
        r = Math.floor(Math.random() * this.nodeCount);
      }
    }

    if (s === r || s >= this.nodeCount || r >= this.nodeCount) {
      return null;
    }

    const selfParent = this.latestEventByNode[r];
    const otherParent = this.latestEventByNode[s];

    if (!selfParent || !otherParent) return null;

    const id = `e_${this.nextEventIndex}`;
    const xSpacing = 52 + Math.floor(Math.random() * 18);
    this.currentMaxX += xSpacing;

    const tx =
      customPayload ||
      SAMPLE_TRANSACTIONS[Math.floor(Math.random() * SAMPLE_TRANSACTIONS.length)];

    // Build ancestors
    const ancestors = new Set<string>();
    ancestors.add(id);

    const selfAncestors = this.ancestorsMap.get(selfParent.id);
    if (selfAncestors) {
      selfAncestors.forEach((a) => ancestors.add(a));
    }
    const otherAncestors = this.ancestorsMap.get(otherParent.id);
    if (otherAncestors) {
      otherAncestors.forEach((a) => ancestors.add(a));
    }
    this.ancestorsMap.set(id, ancestors);

    // Calculate Round based on Hashgraph consensus rules
    const parentMaxRound = Math.max(selfParent.round, otherParent.round);
    let round = parentMaxRound;

    const witnessesOfRound = this.events.filter(
      (e) => e.round === parentMaxRound && e.isWitness
    );

    let stronglySeenCount = 0;
    for (const witness of witnessesOfRound) {
      if (this.canStronglySee(ancestors, witness)) {
        stronglySeenCount++;
      }
    }

    if (stronglySeenCount >= this.supermajority) {
      round = parentMaxRound + 1;
    }

    const hasWitnessInRound = this.events.some(
      (e) => e.creator === r && e.round === round && e.isWitness
    );
    const isWitness = !hasWitnessInRound;

    const newEvent: HashgraphEvent = {
      id,
      index: this.nextEventIndex++,
      creator: r,
      x: this.currentMaxX,
      y: this.getYForNode(r),
      selfParentId: selfParent.id,
      otherParentId: otherParent.id,
      senderNode: s,
      round,
      isWitness,
      isFamous: false,
      status: 'pending',
      consensusOrder: null,
      consensusTimestamp: null,
      createdAt: Date.now(),
      birthTime: performance.now(),
      transactions: [tx],
    };

    this.events.push(newEvent);
    this.eventsMap.set(id, newEvent);
    this.latestEventByNode[r] = newEvent;

    this.updateConsensus();

    return newEvent;
  }

  // Create batch of gossip events for ultra-high speeds
  createGossipBatch(count: number): HashgraphEvent[] {
    const created: HashgraphEvent[] = [];
    for (let i = 0; i < count; i++) {
      const ev = this.createGossipEvent();
      if (ev) created.push(ev);
    }
    return created;
  }

  private canStronglySee(ancestors: Set<string>, targetWitness: HashgraphEvent): boolean {
    const intermediateNodes = new Set<number>();

    for (const ancestorId of ancestors) {
      const ancestor = this.eventsMap.get(ancestorId);
      if (!ancestor) continue;

      const ancestorAnc = this.ancestorsMap.get(ancestorId);
      if (ancestorAnc && ancestorAnc.has(targetWitness.id)) {
        intermediateNodes.add(ancestor.creator);
      }
    }

    return intermediateNodes.size >= this.supermajority;
  }

  updateConsensus() {
    const totalEvents = this.events.length;
    if (totalEvents === 0) return;

    const frontierX = this.currentMaxX;

    for (let i = 0; i < totalEvents; i++) {
      const ev = this.events[i];
      if (ev.status === 'consensus') continue;

      let reachedCurrentNodes = 0;
      for (let n = 0; n < this.nodeCount; n++) {
        const latest = this.latestEventByNode[n];
        if (latest) {
          const anc = this.ancestorsMap.get(latest.id);
          if (anc && anc.has(ev.id)) {
            reachedCurrentNodes++;
          }
        }
      }

      const distanceFromFrontier = frontierX - ev.x;

      if (reachedCurrentNodes >= this.supermajority && distanceFromFrontier > 180) {
        ev.status = 'consensus';
        if (ev.consensusOrder === null) {
          ev.consensusOrder = ++this.consensusCounter;
          ev.consensusTimestamp = ev.createdAt + 100;
        }
      } else if (reachedCurrentNodes >= Math.ceil(this.nodeCount / 2)) {
        ev.status = 'strongly_seen';
      }
    }
  }

  getStats() {
    const totalEvents = this.events.length;
    const consensusEvents = this.events.filter((e) => e.status === 'consensus').length;
    const currentRound = Math.max(1, ...this.events.map((e) => e.round));
    const gossipCount = Math.max(0, totalEvents - this.nodeCount);
    const consensusPercentage =
      totalEvents > 0 ? Math.round((consensusEvents / totalEvents) * 100) : 0;

    return {
      totalEvents,
      consensusEvents,
      currentRound,
      gossipCount,
      consensusPercentage,
    };
  }

  getConnectedGraph(eventId: string): { ancestors: Set<string>; descendants: Set<string> } {
    const ancestors = this.ancestorsMap.get(eventId) || new Set([eventId]);
    const descendants = new Set<string>();

    for (const [id, ancSet] of this.ancestorsMap.entries()) {
      if (ancSet.has(eventId)) {
        descendants.add(id);
      }
    }

    return { ancestors, descendants };
  }
}
