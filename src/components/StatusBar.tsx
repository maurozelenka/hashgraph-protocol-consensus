import React from 'react';
import { SimulationMetrics, ThemeMode } from '../core/types';

interface StatusBarProps {
  theme: ThemeMode;
  metrics: SimulationMetrics;
  nodeCount: number;
  supermajority: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  theme,
  metrics,
  nodeCount,
  supermajority,
}) => {
  const isDark = theme === 'dark';

  return (
    <footer
      className={`px-4 py-1.5 flex items-center justify-between text-[11px] font-mono select-none z-20 border-t transition-colors duration-200 ${
        isDark
          ? 'bg-[#0b0e14] border-[#181d29] text-slate-400'
          : 'bg-white border-slate-200 text-slate-600'
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>network:</span>{' '}
          <span className={isDark ? 'text-slate-200' : 'text-slate-700 font-medium'}>
            hashgraph-simulation
          </span>
        </div>

        <div className={`w-px h-3 ${isDark ? 'bg-[#1e2638]' : 'bg-slate-200'}`} />

        <div>
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>peers:</span>{' '}
          <span className="text-cyan-500 font-bold">{nodeCount} nodes</span>
        </div>

        <div className={`w-px h-3 ${isDark ? 'bg-[#1e2638]' : 'bg-slate-200'} hidden sm:block`} />

        <div className="hidden sm:block">
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>supermajority:</span>{' '}
          <span className={isDark ? 'text-slate-200' : 'text-slate-700 font-medium'}>
            {supermajority}/{nodeCount} (&gt;2/3)
          </span>
        </div>

        <div className={`w-px h-3 ${isDark ? 'bg-[#1e2638]' : 'bg-slate-200'} hidden md:block`} />

        <div className="hidden md:block">
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>events:</span>{' '}
          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {metrics.totalEvents}
          </span>
        </div>

        <div className={`w-px h-3 ${isDark ? 'bg-[#1e2638]' : 'bg-slate-200'} hidden md:block`} />

        <div className="hidden md:block">
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>virtual voting:</span>{' '}
          <span className="text-emerald-500 font-bold">{metrics.consensusEvents}</span>
          <span className={isDark ? 'text-slate-500 ml-1' : 'text-slate-400 ml-1'}>
            ({metrics.consensusPercentage}%)
          </span>
        </div>

        <div className={`w-px h-3 ${isDark ? 'bg-[#1e2638]' : 'bg-slate-200'} hidden lg:block`} />

        <div className="hidden lg:block">
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>round:</span>{' '}
          <span className={isDark ? 'text-slate-200' : 'text-slate-700 font-medium'}>
            {metrics.currentRound}
          </span>
        </div>
      </div>

      <div className={`hidden xl:block text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        Double click on the graph to re-center...
      </div>
    </footer>
  );
};
