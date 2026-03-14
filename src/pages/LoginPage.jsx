// ============================================================
//  src/pages/LoginPage.jsx
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function LoginPage({ onNavigate }) {
    const { login, loading } = useAuth();
    const { toast } = useToast();

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    const handleChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(form.email, form.password);
        if (!result.success) {
            setError(result.message);
            toast.error(result.message);
            setShake(true);
            setTimeout(() => setShake(false), 600);
        }
        // Sucesso: AuthContext atualiza user → Router redireciona
    };

    return (
        <div className="auth-page">
            {/* Painel esquerdo — decorativo */}
            <aside className="auth-brand">
                <div className="brand-inner">
                    <div className="brand-logo">
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <rect width="36" height="36" rx="10" fill="url(#g1)" />
                            <path d="M10 22l6-8 4 5 3-4 5 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <defs>
                                <linearGradient id="g1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#6366f1" />
                                    <stop offset="1" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="brand-name">FinTrack</span>
                    </div>

                    <div className="brand-content">
                        <h2 className="brand-headline">
                            Controle total<br />das suas finanças.
                        </h2>
                        <p className="brand-sub">
                            Acompanhe contas, categorize despesas e visualize<br />
                            seu fluxo de caixa em tempo real.
                        </p>
                    </div>

                    <div className="brand-stats">
                        {[
                            { label: 'Contas gerenciadas', value: '12.4k+' },
                            { label: 'Economia média/mês', value: 'R$ 840' },
                        ].map((s) => (
                            <div key={s.label} className="stat-item">
                                <span className="stat-value">{s.value}</span>
                                <span className="stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Decoração geométrica */}
                    <div className="geo-circle geo-1" />
                    <div className="geo-circle geo-2" />
                </div>
            </aside>

            {/* Painel direito — formulário */}
            <main className="auth-form-panel">
                <div className={`auth-card ${shake ? 'shake' : ''}`}>
                    <div className="auth-card-header">
                        <h1 className="auth-title">Bem-vindo de volta</h1>
                        <p className="auth-subtitle">Entre com suas credenciais para continuar.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form" noValidate>
                        {/* E-mail */}
                        <div className="field-group">
                            <label htmlFor="email" className="field-label">E-mail</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={form.email}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div className="field-group">
                            <label htmlFor="password" className="field-label">Senha</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={form.password}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Erro */}
                        {error && (
                            <div className="auth-error" role="alert">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="auth-btn">
                            {loading ? <span className="btn-spinner" /> : 'Entrar'}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Não tem uma conta?{' '}
                        <button onClick={() => onNavigate('register')} className="auth-link">
                            Criar conta gratuita
                        </button>
                    </p>
                </div>
            </main>
        </div>
    );
}