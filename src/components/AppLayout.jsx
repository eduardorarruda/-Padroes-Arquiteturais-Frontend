// ============================================================
//  src/components/AppLayout.jsx
//  Layout base das telas internas:
//  - Sidebar fixa no desktop
//  - Drawer + overlay no mobile (menu hamburguer)
//  - Topbar com nome do usuário e toggle mobile
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import '../styles/layout.css';

// ── Ícones de navegação ────────────────────────────────────────
const NavIcons = {
    dashboard: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
        </svg>
    ),
    parceiros: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    categorias: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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

// ── Logo da aplicação ──────────────────────────────────────────
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
const NAV_ITEMS = [
    {
        id: 'dashboard',
        label: 'Lançamento de Contas',
        icon: NavIcons.dashboard,
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
];

// ── Componente principal ───────────────────────────────────────
export default function AppLayout({ currentPage, onNavigate, children }) {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Fecha o drawer ao redimensionar para desktop
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const handler = (e) => { if (e.matches) setMobileOpen(false); };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Trava scroll do body quando drawer está aberto
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

    // ── Conteúdo da sidebar ──────────────────────────────────────
    const SidebarContent = () => (
        <div className="sidebar__inner">
            <Logo />

            {/* Navegação principal */}
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

            {/* Rodapé da sidebar: usuário + logout */}
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
            {/* ── Sidebar desktop ───────────────────────────────────── */}
            <aside className="sidebar sidebar--desktop" aria-label="Menu lateral">
                <SidebarContent />
            </aside>

            {/* ── Drawer mobile ─────────────────────────────────────── */}
            <>
                {/* Overlay */}
                <div
                    className={`sidebar-overlay ${mobileOpen ? 'sidebar-overlay--visible' : ''}`}
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />

                {/* Drawer */}
                <aside
                    className={`sidebar sidebar--mobile ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
                    aria-label="Menu lateral"
                    aria-hidden={!mobileOpen}
                >
                    <SidebarContent />
                </aside>
            </>

            {/* ── Área principal ────────────────────────────────────── */}
            <div className="app-layout__main">
                {/* Topbar mobile */}
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

                    <div className="topbar__user-avatar">
                        {(user?.nome ?? 'U')[0].toUpperCase()}
                    </div>
                </header>

                {/* Conteúdo da página */}
                <main className="app-layout__content">
                    {children}
                </main>
            </div>
        </div>
    );
}