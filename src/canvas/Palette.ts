import { ThemeMode } from '../core/types';

export interface ColorScheme {
  background: string;
  gridLine: string;
  laneTrack: string;
  selfParentLine: string;
  gossipPendingCurve: string;
  gossipConsensusCurve: string;
  eventPendingFill: string;
  eventConsensusFill: string;
  nodeCircleBorder: string;
  nodeCircleFill: string;
  nodeLetter: string;
  glowPending: string;
  glowConsensus: string;
}

export const DARK_PALETTE: ColorScheme = {
  background: '#080a0f',
  gridLine: '#141824',
  laneTrack: '#1e2638',
  selfParentLine: '#334155',
  gossipPendingCurve: '#38bdf8',
  gossipConsensusCurve: '#10b981',
  eventPendingFill: '#38bdf8',
  eventConsensusFill: '#10b981',
  nodeCircleBorder: '#06b6d4',
  nodeCircleFill: '#0f1420',
  nodeLetter: '#f8fafc',
  glowPending: 'rgba(56, 189, 248, 0.25)',
  glowConsensus: 'rgba(16, 185, 129, 0.35)',
};

export const LIGHT_PALETTE: ColorScheme = {
  background: '#ffffff',
  gridLine: '#f1f5f9',
  laneTrack: '#475569',
  selfParentLine: '#94a3b8',
  gossipPendingCurve: '#40916c',
  gossipConsensusCurve: '#2d6a4f',
  eventPendingFill: '#52b788',
  eventConsensusFill: '#2d6a4f',
  nodeCircleBorder: '#2d6a4f',
  nodeCircleFill: '#ffffff',
  nodeLetter: '#1e293b',
  glowPending: 'rgba(82, 183, 136, 0.2)',
  glowConsensus: 'rgba(45, 106, 79, 0.22)',
};

export function getPalette(theme: ThemeMode): ColorScheme {
  return theme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
}
