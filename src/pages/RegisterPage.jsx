// ============================================================
//  src/pages/RegisterPage.jsx
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function RegisterPage({ onNavigate }) {
    const { registrar, loading } = useAuth();
    const { toast } = useToast();

    const [form, setForm] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmar: '',
    });
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    const handleChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const validate = () => {
        if (!form.nome.trim()) return 'Informe seu nome completo.';
        if (!form.email.includes('@')) return 'Informe um e-mail válido.';
        if (form.senha.length < 6) return 'A senha deve ter no mínimo 6 caracteres.';
        if (form.senha !== form.confirmar) return 'As senhas não coincidem.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            setShake(true);
            setTimeout(() => setShake(false), 600);
            return;
        }

        const result = await registrar(form.nome, form.email, form.senha);
        if (!result.success) {
            setError(result.message);
            toast.error(result.message);
            setShake(true);
            setTimeout(() => setShake(false), 600);
        }
        // Sucesso → AuthContext faz login automático → Router redireciona
    };

    // Força de senha visual
    const passwordStrength = (() => {
        const p = form.senha;
        if (!p) return 0;
        let score = 0;
        if (p.length >= 6) score++;
        if (p.length >= 10) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^a-zA-Z0-9]/.test(p)) score++;
        return score;
    })();
    const strengthLabel = ['', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Excelente'][passwordStrength];
    const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1'][passwordStrength];

    return (
        <div className="auth-page">
            {/* Painel esquerdo — decorativo */}
            <aside className="auth-brand register-brand">
                <div className="brand-inner">
                    <div className="brand-logo">
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <rect width="36" height="36" rx="10" fill="url(#g2)" />
                            <path d="M10 22l6-8 4 5 3-4 5 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <defs>
                                <linearGradient id="g2" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#6366f1" />
                                    <stop offset="1" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="brand-name">FinTrack</span>
                    </div>

                    <div className="brand-content">
                        <h2 className="brand-headline">
                            Comece sua jornada<br />financeira hoje.
                        </h2>
                        <p className="brand-sub">
                            Cadastre-se gratuitamente e tenha acesso imediato<br />
                            a todas as ferramentas de gestão financeira.
                        </p>
                    </div>

                    <div className="brand-features">
                        {[
                            'Cadastro de contas a pagar e receber',
                            'Categorização por tipo de despesa',
                            'Dashboard com resumo financeiro',
                            'Gestão de clientes e fornecedores',
                        ].map((f) => (
                            <div key={f} className="feature-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {f}
                            </div>
                        ))}
                    </div>

                    <div className="geo-circle geo-1" />
                    <div className="geo-circle geo-2" />
                </div>
            </aside>

            {/* Formulário */}
            <main className="auth-form-panel">
                <div className={`auth-card ${shake ? 'shake' : ''}`}>
                    <div className="auth-card-header">
                        <h1 className="auth-title">Criar conta</h1>
                        <p className="auth-subtitle">Preencha os dados abaixo para começar.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form" noValidate>
                        {/* Nome */}
                        <div className="field-group">
                            <label htmlFor="nome" className="field-label">Nome completo</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <input
                                    id="nome"
                                    name="nome"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={form.nome}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="João da Silva"
                                />
                            </div>
                        </div>

                        {/* E-mail */}
                        <div className="field-group">
                            <label htmlFor="reg-email" className="field-label">E-mail</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                                <input
                                    id="reg-email"
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
                            <label htmlFor="senha" className="field-label">Senha</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="senha"
                                    name="senha"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={form.senha}
                                    onChange={handleChange}
                                    className="auth-input"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            {/* Indicador de força */}
                            {form.senha && (
                                <div className="strength-bar">
                                    <div className="strength-segments">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className="strength-seg"
                                                style={{ background: i <= passwordStrength ? strengthColor : '#e2e8f0' }}
                                            />
                                        ))}
                                    </div>
                                    <span className="strength-label" style={{ color: strengthColor }}>
                                        {strengthLabel}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Confirmar senha */}
                        <div className="field-group">
                            <label htmlFor="confirmar" className="field-label">Confirmar senha</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                <input
                                    id="confirmar"
                                    name="confirmar"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={form.confirmar}
                                    onChange={handleChange}
                                    className={`auth-input ${form.confirmar && form.confirmar !== form.senha ? 'input-error' : ''
                                        }`}
                                    placeholder="Repita a senha"
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
                            {loading ? <span className="btn-spinner" /> : 'Criar minha conta'}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Já tem uma conta?{' '}
                        <button onClick={() => onNavigate('login')} className="auth-link">
                            Fazer login
                        </button>
                    </p>
                </div>
            </main>
        </div>
    );
}