import React from 'react';
import { X, CheckCircle, Clock, Link2, GitFork, ShieldCheck, Hash } from 'lucide-react';
import { ALL_NODE_LETTERS } from '../simulation/hashgraphEngine';
import { HashgraphEvent } from '../types';

interface EventDetailModalProps {
  event: HashgraphEvent | null;
  onClose: () => void;
  onInspectAncestor: (id: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onInspectAncestor,
}) => {
  if (!event) return null;

  const creatorLabel = ALL_NODE_LETTERS[event.creator] || `Nodo ${event.creator}`;
  const senderLabel = event.senderNode !== null ? (ALL_NODE_LETTERS[event.senderNode] || `Nodo ${event.senderNode}`) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3.5 h-3.5 rounded-full bg-emerald-700"
            />
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Evento:</span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {event.id}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Estado de Consenso
              </span>
              <div className="text-sm font-bold mt-0.5">
                {event.status === 'consensus' ? (
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Confirmado por Votación Virtual
                  </span>
                ) : event.status === 'strongly_seen' ? (
                  <span className="text-lime-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-lime-600" />
                    En proceso (Visto por supermayoría)
                  </span>
                ) : (
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Propagándose (Gossip activo)
                  </span>
                )}
              </div>
            </div>

            {event.consensusOrder && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Orden Final
                </span>
                <div className="text-base font-black text-emerald-700">
                  #{event.consensusOrder}
                </div>
              </div>
            )}
          </div>

          {/* Core Properties Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-slate-400 block text-[10px] font-semibold">Nodo Creador</span>
              <span className="font-bold text-slate-800 text-sm">Nodo ({creatorLabel})</span>
              <span className="text-[10px] text-slate-500 block">Identificador #{event.creator}</span>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-slate-400 block text-[10px] font-semibold">Ronda DAG</span>
              <span className="font-bold text-slate-800 text-sm">Ronda {event.round}</span>
              <span className="text-[10px] text-emerald-600 font-medium block">
                {event.isWitness ? 'Testigo (Witness)' : 'Evento regular'}
              </span>
            </div>
          </div>

          {/* DAG Parents (Gossip about Gossip structure) */}
          <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5 text-emerald-600" />
              Estructura DAG (Padres del Evento)
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-slate-400" /> Self-parent:
                </span>
                {event.selfParentId ? (
                  <button
                    onClick={() => onInspectAncestor(event.selfParentId!)}
                    className="font-mono text-slate-700 hover:text-emerald-700 font-semibold underline decoration-dotted"
                  >
                    {event.selfParentId}
                  </button>
                ) : (
                  <span className="text-slate-400 italic">Ninguno (Génesis)</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-emerald-500" /> Other-parent (Gossip):
                </span>
                {event.otherParentId ? (
                  <button
                    onClick={() => onInspectAncestor(event.otherParentId!)}
                    className="font-mono text-emerald-700 hover:text-emerald-900 font-semibold underline decoration-dotted"
                  >
                    {event.otherParentId} {senderLabel ? `(${senderLabel})` : ''}
                  </button>
                ) : (
                  <span className="text-slate-400 italic">Ninguno (Génesis)</span>
                )}
              </div>
            </div>
          </div>

          {/* Payload transactions */}
          <div className="p-3 rounded-xl border border-slate-200 bg-white">
            <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              Carga Útil (Transacciones Incluidas)
            </div>
            <ul className="space-y-1 mt-1 text-[11px] text-slate-600">
              {event.transactions.map((tx, idx) => (
                <li
                  key={idx}
                  className="bg-slate-50 p-1.5 rounded font-mono border border-slate-100 flex items-center justify-between"
                >
                  <span>{tx}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-semibold text-xs hover:bg-slate-900 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
