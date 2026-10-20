import React from 'react';
import { X, CheckCircle, Clock, Link2, GitFork, Hash } from 'lucide-react';
import { HashgraphVertex, NodeIdentity, ThemeMode } from '../core/types';

interface EventInspectorProps {
  theme: ThemeMode;
  event: HashgraphVertex | null;
  nodes: NodeIdentity[];
  onClose: () => void;
  onInspectAncestor: (id: string) => void;
}

export const EventInspector: React.FC<EventInspectorProps> = ({
  theme,
  event,
  nodes,
  onClose,
  onInspectAncestor,
}) => {
  if (!event) return null;

  const isDark = theme === 'dark';
  const creator = nodes[event.creator];
  const sender = event.senderNode !== null ? nodes[event.senderNode] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div
        className={`w-full max-w-md rounded-xl shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-[#0b0e14] border-[#1e2638] text-slate-200'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between ${
            isDark ? 'bg-[#0f1420] border-[#181d29]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <div className="text-sm font-bold flex items-center gap-2">
              <span>Vertex:</span>
              <span
                className={`font-mono px-2 py-0.5 rounded text-xs border ${
                  isDark
                    ? 'bg-[#161c28] text-cyan-400 border-[#252f44]'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {event.id}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1 rounded transition ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-[#182030]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status block */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              isDark ? 'bg-[#0f1420] border-[#1e2638]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Consensus Finality
              </span>
              <div className="text-sm font-bold mt-0.5">
                {event.status === 'consensus' ? (
                  <span className="text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Finalized via Virtual Voting
                  </span>
                ) : event.status === 'strongly_seen' ? (
                  <span className="text-cyan-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Strongly Seen by Supermajority
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Propagating (Gossip In-Flight)
                  </span>
                )}
              </div>
            </div>

            {event.consensusOrder !== null && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Sequence
                </span>
                <div className="text-base font-bold text-emerald-400">
                  #{event.consensusOrder}
                </div>
              </div>
            )}
          </div>

          {/* Core Properties */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-[#0e121a] border-[#1e2638]' : 'bg-white border-slate-200'
              }`}
            >
              <span className="text-slate-400 text-[10px] font-semibold block">Creator</span>
              <span className="font-bold text-sm">
                Node ({creator ? creator.label : event.creator})
              </span>
            </div>

            <div
              className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-[#0e121a] border-[#1e2638]' : 'bg-white border-slate-200'
              }`}
            >
              <span className="text-slate-400 text-[10px] font-semibold block">Round</span>
              <span className="font-bold text-sm">Round {event.round}</span>
              <span className="text-[10px] text-cyan-400 font-medium block">
                {event.isWitness ? 'Witness Vertex' : 'Regular Vertex'}
              </span>
            </div>
          </div>

          {/* DAG Parents */}
          <div
            className={`p-3 rounded-lg border space-y-2 ${
              isDark ? 'bg-[#0e121a] border-[#1e2638]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5 text-cyan-400" />
              DAG Parent Hashes
            </div>

            <div className="space-y-1.5 pt-1">
              <div
                className={`flex items-center justify-between p-2 rounded ${
                  isDark ? 'bg-[#121622]' : 'bg-slate-50'
                }`}
              >
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Link2 className="w-3 h-3" /> Self-parent:
                </span>
                {event.selfParentId ? (
                  <button
                    onClick={() => onInspectAncestor(event.selfParentId!)}
                    className="font-mono text-cyan-400 hover:underline font-semibold"
                  >
                    {event.selfParentId}
                  </button>
                ) : (
                  <span className="text-slate-500 italic">None (Genesis)</span>
                )}
              </div>

              <div
                className={`flex items-center justify-between p-2 rounded ${
                  isDark ? 'bg-[#121622]' : 'bg-slate-50'
                }`}
              >
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-emerald-400" /> Other-parent:
                </span>
                {event.otherParentId ? (
                  <button
                    onClick={() => onInspectAncestor(event.otherParentId!)}
                    className="font-mono text-emerald-400 hover:underline font-semibold"
                  >
                    {event.otherParentId} {sender ? `(${sender.label})` : ''}
                  </button>
                ) : (
                  <span className="text-slate-500 italic">None (Genesis)</span>
                )}
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div
            className={`p-3 rounded-lg border ${
              isDark ? 'bg-[#0e121a] border-[#1e2638]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="font-bold mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              Transactions Payload
            </div>
            <ul className="space-y-1 mt-1 text-[11px]">
              {event.transactions.map((tx, idx) => (
                <li
                  key={idx}
                  className={`p-1.5 rounded font-mono border ${
                    isDark
                      ? 'bg-[#121622] border-[#1e2638] text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {tx}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t flex justify-end ${
            isDark ? 'bg-[#0e121a] border-[#181d29]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-3 py-1.5 rounded font-medium text-xs transition ${
              isDark ? 'bg-[#161c28] text-white hover:bg-[#202838]' : 'bg-slate-900 text-white'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
