export interface NodeInfo {
  id: number;
  label: string;
  name: string;
  color: string;
  accentColor: string;
}

export type ThemeMode = 'dark' | 'light';

export type ConsensusStatus = 'pending' | 'strongly_seen' | 'consensus';

export interface HashgraphEvent {
  id: string;
  index: number;
  creator: number; // 0 to 5 (Node index)
  x: number;
  y: number;
  selfParentId: string | null;
  otherParentId: string | null;
  senderNode: number | null; // which node sent the gossip
  round: number;
  isWitness: boolean;
  isFamous: boolean;
  status: ConsensusStatus;
  consensusOrder: number | null;
  consensusTimestamp: number | null;
  createdAt: number;
  // Visual animation helper
  birthTime: number;
  // Transactions inside event
  transactions: string[];
}

export interface GossipPacket {
  id: string;
  fromNode: number;
  toNode: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number; // 0 to 1
  duration: number; // ms
  startTime: number;
  targetEventId: string;
}

export interface SimulationStats {
  totalEvents: number;
  consensusEvents: number;
  currentRound: number;
  gossipCount: number;
  consensusPercentage: number;
}
