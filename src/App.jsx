// ============================================================
//  src/App.jsx — Roteador principal
// ============================================================

import React, { useState, useEffect } from 'react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ContasPage from './pages/ContasPage';
import ParceirosPage from './pages/ParceirosPage';
import CategoriasPage from './pages/CategoriasPage';

import './styles/auth.css';
import './styles/toast.css';
import './styles/layout.css';

function AuthenticatedApp() {
  const { toast } = useToast();
  // Página inicial: dashboard
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    const shown = sessionStorage.getItem('welcome_shown');
    if (!shown) {
      toast.success('Login realizado com sucesso! Bem-vindo.');
      sessionStorage.setItem('welcome_shown', '1');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'contas': return <ContasPage />;
      case 'parceiros': return <ParceirosPage />;
      case 'categorias': return <CategoriasPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <AppLayout currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </AppLayout>
  );
}

function Router() {
  const { user } = useAuth();
  const [authPage, setAuthPage] = useState('login');

  if (user) return <AuthenticatedApp />;
  return authPage === 'login'
    ? <LoginPage onNavigate={setAuthPage} />
    : <RegisterPage onNavigate={setAuthPage} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}