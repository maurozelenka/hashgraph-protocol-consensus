import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Info,
  Sliders,
  Zap,
  Sun,
  Moon,
  FileCode2,
  Download,
} from 'lucide-react';
import { ThemeMode } from '../core/types';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepGossip: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  autoScroll: boolean;
  onToggleAutoScroll: () => void;
  nodeCount: number;
  onNodeCountChange: (count: number) => void;
  onOpenInfoModal: () => void;
  onOpenPythonModal: () => void;
  onDownloadHtml?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  isPlaying,
  onTogglePlay,
  onStepGossip,
  onReset,
  speed,
  onSpeedChange,
  autoScroll,
  onToggleAutoScroll,
  nodeCount,
  onNodeCountChange,
  onOpenInfoModal,
  onOpenPythonModal,
  onDownloadHtml,
}) => {
  const [nodeInput, setNodeInput] = useState<string>(nodeCount.toString());

  useEffect(() => {
    setNodeInput(nodeCount.toString());
  }, [nodeCount]);

  const commitNodeInput = () => {
    const parsed = parseInt(nodeInput, 10);
    if (!isNaN(parsed) && parsed >= 2 && parsed <= 26) {
      onNodeCountChange(parsed);
    } else {
      setNodeInput(nodeCount.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitNodeInput();
      (e.target as HTMLInputElement).blur();
    }
  };

  const isDark = theme === 'dark';

  return (
    <header
      className={`px-4 py-2 flex flex-col gap-2 select-none z-30 transition-colors duration-200 border-b ${
        isDark
          ? 'bg-[#0b0e14] border-[#181d29] text-slate-200'
          : 'bg-white border-slate-200 text-slate-800 shadow-xs'
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span
            className={`font-bold text-sm tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Hashgraph DAG
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sun / Moon Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded border transition flex items-center justify-center ${
              isDark
                ? 'bg-[#121622] border-[#1e2638] text-amber-400 hover:bg-[#1c2234] hover:text-amber-300'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

        </div>
      </div>

      {/* Main controls row */}
      <div
        className={`flex items-center justify-between flex-wrap gap-3 pt-1 border-t ${
          isDark ? 'border-[#141824]' : 'border-slate-100'
        }`}
      >
        <div className="flex items-center flex-wrap gap-2">
          {/* Direct numeric input for node count */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
              isDark
                ? 'bg-[#121622] border-[#1e2638] text-slate-400'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <span className="text-xs font-medium">Nodes:</span>
            <input
              type="number"
              min="2"
              max="26"
              value={nodeInput}
              onChange={(e) => setNodeInput(e.target.value)}
              onBlur={commitNodeInput}
              onKeyDown={handleKeyDown}
              className={`w-12 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-center focus:outline-none border ${
                isDark
                  ? 'bg-[#080a0f] border-[#273248] text-white focus:border-cyan-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
              }`}
              title="Enter node count (2 to 26)"
            />
          </div>

          <button
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
              isPlaying
                ? isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            onClick={onStepGossip}
            className={`px-2.5 py-1.5 rounded text-xs font-medium border flex items-center gap-1.5 transition ${
              isDark
                ? 'bg-[#121622] border-[#1e2638] text-slate-300 hover:bg-[#1a2030] hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Step a single gossip event"
          >
            <SkipForward className="w-3 h-3 text-cyan-500" />
            <span>Step</span>
          </button>

          <button
            onClick={onReset}
            className={`px-2.5 py-1.5 rounded text-xs font-medium border flex items-center gap-1 transition ${
              isDark
                ? 'bg-[#121622] border-[#1e2638] text-slate-300 hover:bg-[#1a2030] hover:text-rose-400'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-rose-600'
            }`}
            title="Reset DAG state"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Follow / Un-Follow button */}
          <button
            onClick={onToggleAutoScroll}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border transition ${
              autoScroll
                ? isDark
                  ? 'bg-cyan-950/70 text-cyan-300 border-cyan-800 hover:bg-cyan-900/60'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : isDark
                ? 'bg-[#121622] text-slate-400 border-[#1e2638] hover:bg-[#1a2030] hover:text-white'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle camera tracking"
          >
            <span>{autoScroll ? 'Follow' : 'Un-Follow'}</span>
          </button>
        </div>

        {/* Speed slider and presets */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
              isDark ? 'bg-[#121622] border-[#1e2638]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <Sliders className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-400">Speed:</span>
            <input
              type="range"
              min="1"
              max="50"
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-20 sm:w-28 accent-cyan-500 cursor-pointer h-1.5 bg-slate-300 dark:bg-[#1a2133] rounded"
              title="Simulation speed (1x to 50x)"
            />
            <span className="text-[11px] font-mono font-bold text-cyan-500 w-9 text-right">
              {speed}x
            </span>
          </div>

          <div
            className={`hidden lg:flex items-center gap-1 p-0.5 rounded border ${
              isDark ? 'bg-[#121622] border-[#1e2638]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {[1, 5, 10, 25, 50].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                  speed === s
                    ? 'bg-cyan-500 text-black'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#1a2133]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
