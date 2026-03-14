// ============================================================
//  src/contexts/ToastContext.jsx
//  Sistema global de notificações (Toasts).
//  Uso: const { toast } = useToast()
//       toast.success('Mensagem!')
//       toast.error('Algo deu errado.')
//       toast.info('Informação.')
// ============================================================

import React, {
    createContext, useContext, useState, useCallback, useRef
} from 'react';

const ToastContext = createContext(null);

// Ícones inline (sem dependência extra)
const Icons = {
    success: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="9 12 11 14 15 10" />
        </svg>
    ),
    error: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    ),
    info: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    warning: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
};

// Duração padrão por tipo (ms)
const DEFAULT_DURATION = { success: 3500, error: 5000, info: 4000, warning: 4500 };

// ── Provider ──────────────────────────────────────────────────
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const counterRef = useRef(0);

    const dismiss = useCallback((id) => {
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
        // Remove do DOM após a animação de saída (300ms)
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 320);
    }, []);

    const addToast = useCallback(
        (message, type = 'info', duration) => {
            const id = ++counterRef.current;
            const ms = duration ?? DEFAULT_DURATION[type] ?? 4000;

            setToasts((prev) => [...prev.slice(-4), { id, message, type, exiting: false }]);

            const timer = setTimeout(() => dismiss(id), ms);
            // Guarda o timer para limpeza se o usuário fechar manualmente
            setToasts((prev) =>
                prev.map((t) => (t.id === id ? { ...t, _timer: timer } : t))
            );
        },
        [dismiss]
    );

    const toast = {
        success: (msg, dur) => addToast(msg, 'success', dur),
        error: (msg, dur) => addToast(msg, 'error', dur),
        info: (msg, dur) => addToast(msg, 'info', dur),
        warning: (msg, dur) => addToast(msg, 'warning', dur),
    };

    const handleDismiss = (t) => {
        clearTimeout(t._timer);
        dismiss(t.id);
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            {/* Portal de toasts — canto superior direito */}
            <div className="toast-container" aria-live="polite" aria-atomic="false">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`toast toast--${t.type} ${t.exiting ? 'toast--exit' : 'toast--enter'}`}
                        role="alert"
                    >
                        <span className={`toast__icon toast__icon--${t.type}`}>
                            {Icons[t.type]}
                        </span>
                        <span className="toast__message">{t.message}</span>
                        <button
                            className="toast__close"
                            onClick={() => handleDismiss(t)}
                            aria-label="Fechar notificação"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        {/* Barra de progresso */}
                        <div
                            className="toast__progress"
                            style={{ animationDuration: `${DEFAULT_DURATION[t.type]}ms` }}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// Hook
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
    return ctx;
}