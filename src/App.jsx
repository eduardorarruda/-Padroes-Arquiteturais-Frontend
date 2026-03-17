// ============================================================
//  src/App.jsx — Roteador principal (limpo)
// ============================================================

import React, { useState, useEffect } from 'react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ContasPage from './pages/ContasPage';
import ParceirosPage from './pages/ParceirosPage';
import CategoriasPage from './pages/CategoriasPage';

import './styles/auth.css';
import './styles/toast.css';
import './styles/layout.css';

// ─────────────────────────────────────────────────────────────
//  App autenticado — roteamento interno
// ─────────────────────────────────────────────────────────────
function AuthenticatedApp() {
  const { toast } = useToast();
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    const shown = sessionStorage.getItem('welcome_shown');
    if (!shown) {
      toast.success('Login realizado com sucesso! Bem-vindo.');
      sessionStorage.setItem('welcome_shown', '1');
    }
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <ContasPage />;
      case 'parceiros': return <ParceirosPage />;
      case 'categorias': return <CategoriasPage />;
      default: return <ContasPage />;
    }
  };

  return (
    <AppLayout currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────
//  Roteador público
// ─────────────────────────────────────────────────────────────
function Router() {
  const { user } = useAuth();
  const [authPage, setAuthPage] = useState('login');

  if (user) return <AuthenticatedApp />;
  return authPage === 'login'
    ? <LoginPage onNavigate={setAuthPage} />
    : <RegisterPage onNavigate={setAuthPage} />;
}

// ─────────────────────────────────────────────────────────────
//  Raiz
// ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ToastProvider>
  );
}