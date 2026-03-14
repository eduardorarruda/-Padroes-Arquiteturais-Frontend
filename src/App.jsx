// ============================================================
//  src/App.jsx  — Versão com Toast + AppLayout + Roteamento
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle, Trash2, CheckCircle, Clock, DollarSign, AlertCircle
} from 'lucide-react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import './styles/auth.css';
import './styles/toast.css';
import './styles/layout.css';

// URLs via proxy Vite (trailing slash obrigatória)
const API_CONTAS = '/api/contas/';

// ─────────────────────────────────────────────────────────────
//  Tela: Dashboard / Lançamento de Contas
// ─────────────────────────────────────────────────────────────
function DashboardCards({ resumo }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Total Pendente</p>
          <h3 className="text-3xl font-bold text-red-600">
            R$ {(resumo.total_pendente ?? 0).toFixed(2)}
          </h3>
        </div>
        <div className="p-3 bg-red-50 text-red-600 rounded-full">
          <AlertCircle size={32} />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Total Pago</p>
          <h3 className="text-3xl font-bold text-emerald-600">
            R$ {(resumo.total_pago ?? 0).toFixed(2)}
          </h3>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
          <DollarSign size={32} />
        </div>
      </div>
    </div>
  );
}

function FormularioConta({ onContaAdicionada, token }) {
  const { toast } = useToast();
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descricao || !valor || !dataVencimento) return;
    setLoading(true);
    try {
      const res = await fetch(API_CONTAS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          descricao,
          valor: parseFloat(valor),
          data_vencimento: dataVencimento,
          status: 'Pendente',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erro ${res.status}`);
      }
      toast.success('Conta cadastrada com sucesso!');
      onContaAdicionada();
      setDescricao('');
      setValor('');
      setDataVencimento('');
    } catch (error) {
      toast.error(`Falha ao cadastrar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <PlusCircle className="text-blue-600" size={20} />
        Nova Conta a Pagar
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Ex: Conta de Luz" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
          <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="0.00" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
          <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required />
        </div>
        <div className="md:col-span-4 flex justify-end mt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2">
            {loading && (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            Cadastrar Conta
          </button>
        </div>
      </form>
    </div>
  );
}

function ListaContas({ contas, onAtualizarStatus, onDeletarConta }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Listagem de Contas</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Descrição</th>
              <th className="p-4 font-medium">Vencimento</th>
              <th className="p-4 font-medium">Valor</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contas.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">
                  Nenhuma conta cadastrada no momento.
                </td>
              </tr>
            ) : (
              contas.map((conta) => (
                <tr key={conta.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-800 font-medium">{conta.descricao}</td>
                  <td className="p-4 text-slate-600">
                    {new Date(conta.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </td>
                  <td className="p-4 text-slate-800 font-medium">
                    R$ {conta.valor.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                      ${conta.status === 'Pago'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'}`}>
                      {conta.status === 'Pago' ? <CheckCircle size={14} /> : <Clock size={14} />}
                      {conta.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    {conta.status === 'Pendente' && (
                      <button onClick={() => onAtualizarStatus(conta.id, 'Pago')}
                        title="Marcar como Pago"
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button onClick={() => onDeletarConta(conta.id)}
                      title="Excluir Conta"
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [contas, setContas] = useState([]);
  const [resumo, setResumo] = useState({ total_pendente: 0, total_pago: 0 });
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const carregarDados = useCallback(async () => {
    try {
      const res = await fetch(API_CONTAS, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const lista = await res.json();
      setContas(lista);
      setResumo(
        lista.reduce(
          (acc, c) => {
            c.status === 'Pago'
              ? (acc.total_pago += c.valor)
              : (acc.total_pendente += c.valor);
            return acc;
          },
          { total_pendente: 0, total_pago: 0 }
        )
      );
    } catch (err) {
      toast.error(`Erro ao carregar contas: ${err.message}`);
    }
  }, [token]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleAtualizarStatus = async (id, novoStatus) => {
    try {
      const res = await fetch(`/api/contas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Status atualizado!');
      carregarDados();
    } catch (err) {
      toast.error(`Falha ao atualizar: ${err.message}`);
    }
  };

  const handleDeletarConta = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta conta?')) return;
    try {
      const res = await fetch(`/api/contas/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Conta excluída com sucesso.');
      carregarDados();
    } catch (err) {
      toast.error(`Falha ao excluir: ${err.message}`);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Lançamento de Contas
        </h1>
        <p className="text-slate-500 mt-1">Gerencie suas contas a pagar e receber.</p>
      </header>
      <DashboardCards resumo={resumo} />
      <FormularioConta onContaAdicionada={carregarDados} token={token} />
      <ListaContas
        contas={contas}
        onAtualizarStatus={handleAtualizarStatus}
        onDeletarConta={handleDeletarConta}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Placeholders (Etapa 2)
// ─────────────────────────────────────────────────────────────
function PlaceholderPage({ title, description, icon }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 text-indigo-400">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-slate-700 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-sm">{description}</p>
      <span className="mt-4 inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium">
        Em breve — Etapa 2
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  App autenticado
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
      case 'dashboard': return <DashboardPage />;
      case 'parceiros':
        return (
          <PlaceholderPage
            title="Cadastro de Parceiros"
            description="Gerencie clientes e fornecedores. Será implementado na Etapa 2."
            icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
          />
        );
      case 'categorias':
        return (
          <PlaceholderPage
            title="Cadastro de Categorias"
            description="Organize suas despesas por categoria. Será implementado na Etapa 2."
            icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>}
          />
        );
      default: return <DashboardPage />;
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