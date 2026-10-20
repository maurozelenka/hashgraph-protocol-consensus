import React from 'react';
import { X, Network, Vote, GitCommit, CheckCircle2 } from 'lucide-react';

interface EducationalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EducationalModal: React.FC<EducationalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ¿Cómo funciona el Protocolo Hashgraph?
              </h2>
              <p className="text-xs text-slate-500">
                Gossip about Gossip, DAG y Votación Virtual explicados paso a paso
              </p>
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
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs leading-relaxed">
          {/* Concept 1: Gossip about Gossip */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <Network className="w-4 h-4 text-emerald-600" />
              1. Gossip about Gossip (El Chisme sobre el Chisme)
            </div>
            <p className="text-slate-600">
              En una red Hashgraph, los nodos no solo transmiten transacciones. Cada vez que un
              nodo le cuenta algo a otro (Gossip), crean un <strong>evento</strong> en el carril
              del receptor con dos punteros criptográficos (hashes):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>
                <strong className="text-slate-800">Self-parent (línea recta):</strong> El hash de su
                propio último evento en ese mismo carril.
              </li>
              <li>
                <strong className="text-slate-800">Other-parent (curva Bézier verde):</strong> El
                hash del último evento del nodo emisor del gossip.
              </li>
            </ul>
            <p className="text-emerald-900 font-medium bg-emerald-100/60 p-2 rounded-md">
              Nota clave: Toda la red construye colaborativamente un Grafo Acíclico Dirigido (DAG)
              que registra con precisión matemática <em>quién le contó qué a quién y cuándo</em>.
            </p>
          </div>

          {/* Concept 2: Virtual Voting */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-2">
            <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
              <Vote className="w-4 h-4 text-blue-600" />
              2. Votación Virtual (Virtual Voting): Consenso sin enviar votos
            </div>
            <p className="text-slate-600">
              Esta es la genialidad de Hashgraph creada por Leemon Baird: <strong>¡Cero bytes de
              votación viajan por el cable!</strong>
            </p>
            <p className="text-slate-600">
              Dado que cada nodo posee una copia del mismo DAG de eventos, cualquier nodo puede
              calcular de forma local e independiente cómo votaría cualquier otro nodo en la red.
              No se necesitan mensajes de votación, eliminando el ancho de banda desperdiciado.
            </p>
          </div>

          {/* Concept 3: Color transitions */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <GitCommit className="w-4 h-4 text-slate-600" />
              3. ¿Por qué cambian de color los eventos en esta simulación?
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-lg border border-lime-200 bg-lime-50/70">
                <div className="font-bold text-lime-800 flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-500" />
                  Verde Lima (Nuevo)
                </div>
                <p className="text-slate-600 text-[11px]">
                  Eventos recién emitidos. Solo el nodo creador y su interlocutor inmediato los
                  conocen. Están en cola de validación.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70">
                <div className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 border border-emerald-400" />
                  Verde Esmeralda (Consenso)
                </div>
                <p className="text-slate-600 text-[11px]">
                  Confirmados por Votación Virtual con supermayoría (&gt; 2/3 de los nodos). Tienen
                  orden cronológico final garantizado e inmutable.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="p-2.5">Característica</th>
                  <th className="p-2.5">Blockchain Tradicional</th>
                  <th className="p-2.5 text-emerald-700">Hashgraph</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 font-semibold text-slate-600">Estructura</td>
                  <td className="p-2.5 text-slate-500">Cadena lineal (árbol podado)</td>
                  <td className="p-2.5 font-medium text-emerald-800">DAG completo (nada se poda)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-600">Mensajes de Votación</td>
                  <td className="p-2.5 text-slate-500">Elevado tráfico en red (PBFT/PoS)</td>
                  <td className="p-2.5 font-medium text-emerald-800">0 mensajes (Votación Virtual)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-600">Seguridad</td>
                  <td className="p-2.5 text-slate-500">Probabilística o dependiente de mineros</td>
                  <td className="p-2.5 font-medium text-emerald-800">Matemáticamente probada (Tolerancia bizantina)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Listo para proyectar en clase o grabar la pantalla
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
