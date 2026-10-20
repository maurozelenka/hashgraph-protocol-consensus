export type ThemeMode = 'dark' | 'light';

export type EventStatus = 'pending' | 'strongly_seen' | 'consensus';

export interface NodeIdentity {
  id: number;
  label: string;
  name: string;
  color: string;
}

export interface HashgraphVertex {
  id: string;
  seq: number;
  creator: number;
  selfParentId: string | null;
  otherParentId: string | null;
  senderNode: number | null;
  round: number;
  isWitness: boolean;
  isFamous: boolean;
  status: EventStatus;
  consensusOrder: number | null;
  consensusTimestamp: number | null;
  createdAt: number;
  x: number;
  y: number;
  transactions: string[];
}

export interface SimulationMetrics {
  totalEvents: number;
  consensusEvents: number;
  currentRound: number;
  gossipCount: number;
  consensusPercentage: number;
}
