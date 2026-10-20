import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode2 } from 'lucide-react';
import { generateStandaloneHtml } from '../utils/exportHtml';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onDownload }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const code = generateStandaloneHtml();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Código Unificado: hashgraph.html
              </h2>
              <p className="text-xs text-slate-500">
                Un único archivo HTML + Canvas con cero dependencias externas, listo para doble clic
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 transition shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Todo el Código</span>
                </>
              )}
            </button>

            <button
              onClick={onDownload}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Descargar Archivo</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code viewer */}
        <div className="p-4 bg-slate-950 flex-1 overflow-auto font-mono text-[11px] text-slate-300 leading-relaxed selection:bg-emerald-900 selection:text-white">
          <pre className="whitespace-pre">{code}</pre>
        </div>

        {/* Footer instructions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            <strong>Instrucciones:</strong> Guarda este contenido como <code>hashgraph.html</code> y ábrelo con doble clic en tu navegador preferido (Chrome, Safari, Firefox, Edge).
          </span>
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
