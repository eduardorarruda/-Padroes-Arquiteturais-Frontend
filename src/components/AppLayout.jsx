// ============================================================
//  src/components/AppLayout.jsx
//  Sidebar fixa no desktop, drawer + overlay no mobile.
//  NAV atualizado: dashboard | contas | parceiros | categorias
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { notificacoesAPI } from '../services/api';
import '../styles/layout.css';

// ── Ícones ────────────────────────────────────────────────────
const NavIcons = {
    dashboard: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
        </svg>
    ),
    contas: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
    ),
    parceiros: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    categorias: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    contasCorrentes: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 10h20" />
            <path d="M12 4v16" />
        </svg>
    ),
    cartoes: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
            <line x1="5" y1="15" x2="10" y2="15" />
        </svg>
    ),
    logout: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    menu: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    ),
    close: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
};

function Logo() {
    return (
        <div className="sidebar__logo">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="url(#sidebarGrad)" />
                <path d="M10 22l6-8 4 5 3-4 5 7" stroke="#fff" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                    <linearGradient id="sidebarGrad" x1="0" y1="0" x2="36" y2="36"
                        gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6366f1" />
                        <stop offset="1" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
            </svg>
            <span className="sidebar__logo-text">FinTrack</span>
        </div>
    );
}

// ── Itens de navegação ─────────────────────────────────────────
// 'dashboard' → DashboardPage (gráficos)
// 'contas'    → ContasPage    (lançamentos)
const NAV_ITEMS = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: NavIcons.dashboard,
    },
    {
        id: 'contas',
        label: 'Lançamento de Contas',
        icon: NavIcons.contas,
    },
    {
        id: 'parceiros',
        label: 'Cadastro de Parceiros',
        icon: NavIcons.parceiros,
    },
    {
        id: 'categorias',
        label: 'Cadastro de Categorias',
        icon: NavIcons.categorias,
    },
    {
        id: 'contas-correntes',
        label: 'Contas Correntes',
        icon: NavIcons.contasCorrentes,
    },
    {
        id: 'cartoes',
        label: 'Cartões de Crédito',
        icon: NavIcons.cartoes,
    },
];

export default function AppLayout({ currentPage, onNavigate, children }) {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Estados de Notificações
    const [notificacoes, setNotificacoes] = useState([]);
    const [menuAberto, setMenuAberto] = useState(false);

    useEffect(() => {
        const fetchNotificacoes = async () => {
            try {
                await notificacoesAPI.sincronizar();
                const data = await notificacoesAPI.listarNaoLidas();
                setNotificacoes(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Erro ao carregar notificações", err);
            }
        };
        fetchNotificacoes();
    }, []);

    const handleMarcarLida = async (id) => {
        try {
            await notificacoesAPI.marcarLida(id);
            setNotificacoes(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            toast.error('Erro ao marcar notificação como lida.');
        }
    };

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const handler = (e) => { if (e.matches) setMobileOpen(false); };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const handleNavigate = useCallback((page) => {
        onNavigate(page);
        setMobileOpen(false);
    }, [onNavigate]);

    const handleLogout = useCallback(() => {
        logout();
        toast.info('Você saiu da sua conta.');
    }, [logout, toast]);

    const SidebarContent = () => (
        <div className="sidebar__inner">
            <Logo />

            <nav className="sidebar__nav" aria-label="Navegação principal">
                <ul className="sidebar__nav-list">
                    {NAV_ITEMS.map((item) => {
                        const isActive = currentPage === item.id;
                        return (
                            <li key={item.id}>
                                <button
                                    className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
                                    onClick={() => handleNavigate(item.id)}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <span className="sidebar__nav-icon">{item.icon}</span>
                                    <span className="sidebar__nav-label">{item.label}</span>
                                    {isActive && <span className="sidebar__nav-indicator" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="sidebar__footer">
                <div className="sidebar__user">
                    <div className="sidebar__user-avatar">
                        {(user?.nome ?? 'U')[0].toUpperCase()}
                    </div>
                    <div className="sidebar__user-info">
                        <span className="sidebar__user-name">{user?.nome ?? 'Usuário'}</span>
                        <span className="sidebar__user-email">{user?.email ?? ''}</span>
                    </div>
                </div>

                <button
                    className="sidebar__logout"
                    onClick={handleLogout}
                    title="Sair da conta"
                >
                    {NavIcons.logout}
                    <span>Sair</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="app-layout">
            {/* Sidebar desktop */}
            <aside className="sidebar sidebar--desktop" aria-label="Menu lateral">
                <SidebarContent />
            </aside>

            {/* Drawer mobile */}
            <>
                <div
                    className={`sidebar-overlay ${mobileOpen ? 'sidebar-overlay--visible' : ''}`}
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
                <aside
                    className={`sidebar sidebar--mobile ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
                    aria-label="Menu lateral"
                    aria-hidden={!mobileOpen}
                >
                    <SidebarContent />
                </aside>
            </>

            {/* Área principal */}
            <div className="app-layout__main">
                <header className="topbar">
                    <button
                        className="topbar__menu-btn"
                        onClick={() => setMobileOpen((v) => !v)}
                        aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? NavIcons.close : NavIcons.menu}
                    </button>
                    <Logo />
                    
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setMenuAberto(!menuAberto)}
                                className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
                                aria-label="Notificações"
                            >
                                <Bell size={24} />
                                {notificacoes.length > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                        {notificacoes.length}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown flutuante */}
                            {menuAberto && (
                                <div className="absolute right-0 top-12 mt-2 w-80 bg-white shadow-lg rounded-md z-50 border border-gray-100 flex flex-col">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                                        {notificacoes.length === 0 ? (
                                            <p className="px-4 py-6 text-sm text-gray-500 text-center">
                                                Nenhuma nova notificação
                                            </p>
                                        ) : (
                                            notificacoes.map(notif => (
                                                <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className="text-sm text-gray-700 flex-1">
                                                            {notif.mensagem}
                                                        </p>
                                                        <button
                                                            onClick={() => handleMarcarLida(notif.id)}
                                                            className="text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0"
                                                            title="Marcar como lida"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                    </div>
                                                    <span className="text-xs text-gray-400 mt-2 block">
                                                        {new Date(notif.data_criacao).toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="topbar__user-avatar">
                            {(user?.nome ?? 'U')[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                <main className="app-layout__content">
                    {children}
                </main>
            </div>
        </div>
    );
}