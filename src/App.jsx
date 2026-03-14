import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Trash2,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';

// URL base da nossa API FastAPI
const API_URL = 'http://localhost:8000/api/contas';

/**
 * COMPONENTE: DashboardCards
 * Responsabilidade: Exibir os totais gerais (Pago e Pendente) vindos da API.
 * Padrão: Presentational Component (Componente Burro/Visual)
 */
const DashboardCards = ({ resumo }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">Total Pendente</p>
        <h3 className="text-3xl font-bold text-red-600">
          R$ {resumo.total_pendente.toFixed(2)}
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
          R$ {resumo.total_pago.toFixed(2)}
        </h3>
      </div>
      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
        <DollarSign size={32} />
      </div>
    </div>
  </div>
);

/**
 * COMPONENTE: FormularioConta
 * Responsabilidade: Coletar dados do usuário para criar uma nova conta.
 */
const FormularioConta = ({ onContaAdicionada }) => {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descricao || !valor || !dataVencimento) return;

    const novaConta = {
      descricao,
      valor: parseFloat(valor),
      data_vencimento: dataVencimento,
      status: 'Pendente'
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaConta)
      });

      if (response.ok) {
        onContaAdicionada();
        setDescricao('');
        setValor('');
        setDataVencimento('');
      }
    } catch (error) {
      console.error("Erro ao adicionar conta:", error);
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
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Ex: Conta de Luz"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
          <input
            type="date"
            value={dataVencimento}
            onChange={(e) => setDataVencimento(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>
        <div className="md:col-span-4 flex justify-end mt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
          >
            Cadastrar Conta
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * COMPONENTE: ListaContas
 * Responsabilidade: Renderizar a tabela de contas e emitir ações (pagar/excluir).
 */
const ListaContas = ({ contas, onAtualizarStatus, onDeletarConta }) => {
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
                <tr key={conta.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-800 font-medium">{conta.descricao}</td>
                  <td className="p-4 text-slate-600">
                    {new Date(conta.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </td>
                  <td className="p-4 text-slate-800 font-medium">
                    R$ {conta.valor.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                      ${conta.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {conta.status === 'Pago' ? <CheckCircle size={14} /> : <Clock size={14} />}
                      {conta.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    {conta.status === 'Pendente' && (
                      <button
                        onClick={() => onAtualizarStatus(conta.id, 'Pago')}
                        title="Marcar como Pago"
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => onDeletarConta(conta.id)}
                      title="Excluir Conta"
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
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
};

/**
 * COMPONENTE PRINCIPAL (Container Component)
 * Responsabilidade: Gerenciar o estado global da tela e coordenar chamadas à API.
 */
export default function App() {
  const [contas, setContas] = useState([]);
  const [resumo, setResumo] = useState({ total_pendente: 0, total_pago: 0 });

  // Função para buscar dados da API
  const carregarDados = async () => {
    try {
      // Busca a lista de contas
      const resContas = await fetch(API_URL);
      const dataContas = await resContas.json();
      setContas(dataContas);

      // Busca o resumo do dashboard
      const resResumo = await fetch(`${API_URL}/resumo/dashboard`);
      const dataResumo = await resResumo.json();
      setResumo(dataResumo);
    } catch (error) {
      console.error("Erro ao carregar dados da API:", error);
    }
  };

  // Executa ao carregar a página
  useEffect(() => {
    carregarDados();
  }, []);

  const handleAtualizarStatus = async (id, novoStatus) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const handleDeletarConta = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta conta?")) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      carregarDados();
    } catch (error) {
      console.error("Erro ao deletar conta:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Controle Financeiro
          </h1>
          <p className="text-slate-500 mt-1">
            Gestão de contas a pagar - <span className="text-blue-600 font-medium">Padrão N-Tier & React</span>
          </p>
        </header>

        {/* Dashboard com Cards Componentizados */}
        <DashboardCards resumo={resumo} />

        {/* Formulário Componentizado */}
        <FormularioConta onContaAdicionada={carregarDados} />

        {/* Listagem Componentizada */}
        <ListaContas
          contas={contas}
          onAtualizarStatus={handleAtualizarStatus}
          onDeletarConta={handleDeletarConta}
        />

      </div>
    </div>
  );
}
