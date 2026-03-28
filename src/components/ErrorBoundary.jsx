// ============================================================
//  src/components/ErrorBoundary.jsx
//  MELHORIA 4 — Error Boundary global.
//  Envolve toda a árvore autenticada e exibe tela de fallback.
// ============================================================

import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-10 max-w-md w-full text-center">
                        {/* Ícone */}
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>

                        <h1 className="text-xl font-bold text-slate-800 mb-2">
                            Algo deu errado
                        </h1>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            Ocorreu um erro inesperado na aplicação.
                            Tente recarregar a página. Se o problema persistir, entre em contato com o suporte.
                        </p>

                        {/* Detalhe do erro (apenas em dev) */}
                        {import.meta.env.DEV && this.state.error && (
                            <pre className="text-left bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-red-700 mb-5 overflow-auto max-h-32">
                                {this.state.error.toString()}
                            </pre>
                        )}

                        <button
                            onClick={this.handleReload}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                        >
                            Recarregar página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}