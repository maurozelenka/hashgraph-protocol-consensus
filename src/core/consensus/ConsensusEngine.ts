import { ReachabilityIndex } from '../dag/ReachabilityIndex';
import { calculateBFTThreshold } from './Supermajority';
import { HashgraphVertex, NodeIdentity, SimulationMetrics } from '../types';

const NODE_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export class ConsensusEngine {
  private _nodeCount: number;
  private _nodes: NodeIdentity[] = [];
  private _events: HashgraphVertex[] = [];
  private _eventsMap = new Map<string, HashgraphVertex>();
  private _latestByNode: (HashgraphVertex | null)[] = [];
  private _reachability = new ReachabilityIndex();
  private _nextSeq = 0;
  private _consensusOrder = 0;
  private _maxX = 140;

  readonly laneHeight: number;
  readonly topPadding: number;

  constructor(nodeCount = 5, laneHeight = 72, topPadding = 75) {
    this._nodeCount = Math.max(2, Math.min(26, nodeCount));
    this.laneHeight = laneHeight;
    this.topPadding = topPadding;
    this.rebuildNodes();
    this.reset();
  }

  get nodeCount(): number {
    return this._nodeCount;
  }

  set nodeCount(count: number) {
    this._nodeCount = Math.max(2, Math.min(26, count));
    this.rebuildNodes();
    this.reset();
  }

  get nodes(): NodeIdentity[] {
    return this._nodes;
  }

  get events(): HashgraphVertex[] {
    return this._events;
  }

  get eventsMap(): Map<string, HashgraphVertex> {
    return this._eventsMap;
  }

  get currentMaxX(): number {
    return this._maxX;
  }

  get supermajority(): number {
    return calculateBFTThreshold(this._nodeCount);
  }

  getNodeY(nodeIndex: number): number {
    return this.topPadding + nodeIndex * this.laneHeight;
  }

  private rebuildNodes(): void {
    const palette = [
      '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
      '#f59e0b', '#14b8a6', '#6366f1', '#d946ef', '#84cc16'
    ];

    this._nodes = Array.from({ length: this._nodeCount }, (_, i) => ({
      id: i,
      label: NODE_LABELS[i] || `N${i + 1}`,
      name: `Node ${NODE_LABELS[i] || i + 1}`,
      color: palette[i % palette.length],
    }));
  }

  reset(): void {
    this._events = [];
    this._eventsMap.clear();
    this._reachability.clear();
    this._latestByNode = new Array(this._nodeCount).fill(null);
    this._nextSeq = 0;
    this._consensusOrder = 0;
    this._maxX = 140;

    for (let i = 0; i < this._nodeCount; i++) {
      const id = `e_gen_${this._nodes[i].label}`;
      const vertex: HashgraphVertex = {
        id,
        seq: this._nextSeq++,
        creator: i,
        x: 160 + (i % 2 === 1 ? 20 : 0),
        y: this.getNodeY(i),
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
        transactions: [`Genesis (${this._nodes[i].label})`],
      };

      this._events.push(vertex);
      this._eventsMap.set(id, vertex);
      this._reachability.registerGenesis(id);
      this._latestByNode[i] = vertex;
    }

    this.resolveConsensus();
  }

  createGossipEvent(senderNode?: number, receiverNode?: number): HashgraphVertex | null {
    let s = senderNode;
    let r = receiverNode;

    if (s === undefined || r === undefined) {
      s = Math.floor(Math.random() * this._nodeCount);
      r = Math.floor(Math.random() * this._nodeCount);
      while (r === s && this._nodeCount > 1) {
        r = Math.floor(Math.random() * this._nodeCount);
      }
    }

    if (s === r || s >= this._nodeCount || r >= this._nodeCount) {
      return null;
    }

    const selfParent = this._latestByNode[r];
    const otherParent = this._latestByNode[s];

    if (!selfParent || !otherParent) return null;

    const id = `e_${this._nextSeq}`;
    this._maxX += 52 + Math.floor(Math.random() * 18);

    const ancestors = this._reachability.registerEvent(id, selfParent.id, otherParent.id);

    const parentMaxRound = Math.max(selfParent.round, otherParent.round);
    let round = parentMaxRound;

    const roundWitnesses = this._events.filter(
      (e) => e.round === parentMaxRound && e.isWitness
    );

    let stronglySeenCount = 0;
    for (const witness of roundWitnesses) {
      if (this._reachability.canStronglySee(ancestors, witness, this._eventsMap, this.supermajority)) {
        stronglySeenCount++;
      }
    }

    if (stronglySeenCount >= this.supermajority) {
      round = parentMaxRound + 1;
    }

    const hasWitnessInRound = this._events.some(
      (e) => e.creator === r && e.round === round && e.isWitness
    );
    const isWitness = !hasWitnessInRound;

    const vertex: HashgraphVertex = {
      id,
      seq: this._nextSeq++,
      creator: r,
      x: this._maxX,
      y: this.getNodeY(r),
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
      transactions: [`Tx ${this._nodes[s].label}->${this._nodes[r].label} #${this._nextSeq}`],
    };

    this._events.push(vertex);
    this._eventsMap.set(id, vertex);
    this._latestByNode[r] = vertex;

    this.resolveConsensus();
    return vertex;
  }

  createGossipBatch(count: number): HashgraphVertex[] {
    const list: HashgraphVertex[] = [];
    for (let i = 0; i < count; i++) {
      const vertex = this.createGossipEvent();
      if (vertex) list.push(vertex);
    }
    return list;
  }

  private resolveConsensus(): void {
    const total = this._events.length;
    if (total === 0) return;

    const frontierX = this._maxX;

    for (let i = 0; i < total; i++) {
      const ev = this._events[i];
      if (ev.status === 'consensus') continue;

      let reachedNodes = 0;
      for (let n = 0; n < this._nodeCount; n++) {
        const latest = this._latestByNode[n];
        if (latest && this._reachability.canSee(latest.id, ev.id)) {
          reachedNodes++;
        }
      }

      const dist = frontierX - ev.x;
      if (reachedNodes >= this.supermajority && dist > 180) {
        ev.status = 'consensus';
        if (ev.consensusOrder === null) {
          ev.consensusOrder = ++this._consensusOrder;
          ev.consensusTimestamp = ev.createdAt + 100;
        }
      } else if (reachedNodes >= Math.ceil(this._nodeCount / 2)) {
        ev.status = 'strongly_seen';
      }
    }
  }

  getMetrics(): SimulationMetrics {
    const totalEvents = this._events.length;
    const consensusEvents = this._events.filter((e) => e.status === 'consensus').length;
    const currentRound = Math.max(1, ...this._events.map((e) => e.round));
    const gossipCount = Math.max(0, totalEvents - this._nodeCount);
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

  getAncestors(eventId: string): Set<string> {
    return this._reachability.getAncestors(eventId);
  }
}
