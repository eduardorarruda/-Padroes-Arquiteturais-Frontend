// ============================================================
//  src/components/ConfirmModal.jsx
//  Modal de confirmação reutilizável via ReactDOM.createPortal.
//  Substitui window.confirm() em todo o projeto.
//
//  Props:
//    isOpen   : bool
//    title    : string
//    message  : string
//    onConfirm: () => void
//    onCancel : () => void
//    danger   : bool  — botão de confirmação vermelho
// ============================================================

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, Info } from 'lucide-react';

export default function ConfirmModal({
    isOpen,
    title = 'Confirmar ação',
    message = 'Deseja continuar?',
    onConfirm,
    onCancel,
    danger = false,
}) {
    const overlayRef = useRef(null);

    // Fecha ao pressionar Esc
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onCancel]);

    // Trava scroll do body
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const modal = (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,15,26,.55)', backdropFilter: 'blur(3px)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                style={{ animation: 'confirmIn .22s cubic-bezier(.22,1,.36,1) both' }}
            >
                {/* Ícone */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto
                    ${danger ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {danger
                        ? <AlertTriangle size={24} />
                        : <Info size={24} />}
                </div>

                {/* Título */}
                <h2
                    id="confirm-modal-title"
                    className="text-lg font-bold text-slate-800 text-center mb-2"
                >
                    {title}
                </h2>

                {/* Mensagem */}
                <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
                    {message}
                </p>

                {/* Botões */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors
                            ${danger
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        Confirmar
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes confirmIn {
                    from { opacity: 0; transform: scale(.94) translateY(8px); }
                    to   { opacity: 1; transform: none; }
                }
            `}</style>
        </div>
    );

    return ReactDOM.createPortal(modal, document.getElementById('root'));
}