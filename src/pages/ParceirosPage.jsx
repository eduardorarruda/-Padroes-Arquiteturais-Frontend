// ============================================================
//  src/pages/ParceirosPage.jsx
//  BUG 1 FIX  : handleDeletar usa parceirosAPI.deletar()
//  FEATURE 1  : ConfirmModal substitui window.confirm()
//  FEATURE 2  : Edição inline (modal) com PUT
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
    PlusCircle, Trash2, Users, Building2, Search,
    UserCheck, Briefcase, Pencil, Check, X,
} from 'lucide-react';
import { parceirosAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

// ── Badge de tipo ──────────────────────────────────────────────
function TipoBadge({ tipo }) {
    const isCliente = tipo === 'Cliente';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
            ${isCliente ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>
            {isCliente ? <UserCheck size={12} /> : <Briefcase size={12} />}
            {tipo}
        </span>
    );
}

// ── Modal de edição inline ─────────────────────────────────────
function ModalEdicaoParceiro({ parceiro, onSalvo, onFechar }) {
    const { toast } = useToast();
    const [nome, setNome] = useState(parceiro.nome);
    const [tipo, setTipo] = useState(parceiro.tipo);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const esc = (e) => { if (e.key === 'Escape') onFechar(); };
        document.addEventListener('keydown', esc);
        return () => document.removeEventListener('keydown', esc);
    }, [onFechar]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nome.trim()) return;
        setLoading(true);
        try {
            await parceirosAPI.atualizar(parceiro.id, { nome: nome.trim(), tipo });
            toast.success('Parceiro atualizado com sucesso!');
            onSalvo();
        } catch (err) {
            toast.error(`Erro ao atualizar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,15,26,.55)', backdropFilter: 'blur(3px)' }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                style={{ animation: 'confirmIn .22s cubic-bezier(.22,1,.36,1) both' }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Pencil size={16} className="text-indigo-600" />
                        Editar Parceiro
                    </h2>
                    <button onClick={onFechar} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            autoFocus
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                        <select
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                        >
                            <option value="Cliente">Cliente</option>
                            <option value="Fornecedor">Fornecedor</option>
                        </select>
                    </div>
                    <div className="flex gap-3 mt-1">
                        <button type="button" onClick={onFechar}
                            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading || !nome.trim()}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                            {loading
                                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                : <Check size={15} />}
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
            <style>{`@keyframes confirmIn{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:none}}`}</style>
        </div>
    );
}

// ── Formulário de cadastro ─────────────────────────────────────
function FormularioParceiro({ onAdicionado }) {
    const { toast } = useToast();
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('Cliente');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nome.trim()) return;
        setLoading(true);
        try {
            await parceirosAPI.criar(nome.trim(), tipo);
            toast.success(`Parceiro "${nome.trim()}" cadastrado com sucesso!`);
            onAdicionado();
            setNome('');
            setTipo('Cliente');
        } catch (err) {
            toast.error(`Falha ao cadastrar parceiro: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <PlusCircle className="text-indigo-600" size={18} />
                Novo Parceiro
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome do parceiro</label>
                    <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        placeholder="Ex: Fornecedor ABC Ltda"
                        required
                    />
                </div>
                <div className="sm:w-44">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                    >
                        <option value="Cliente">Cliente</option>
                        <option value="Fornecedor">Fornecedor</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="sm:mb-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                    {loading
                        ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                        : <PlusCircle size={15} />}
                    Cadastrar
                </button>
            </form>
        </div>
    );
}

// ── Listagem ───────────────────────────────────────────────────
function ListaParceiros({ parceiros, filtro, onEditar, onDeletar }) {
    const filtrados = parceiros.filter((p) => {
        const matchBusca = p.nome.toLowerCase().includes(filtro.busca.toLowerCase());
        const matchTipo = filtro.tipo === 'Todos' || p.tipo === filtro.tipo;
        return matchBusca && matchTipo;
    });

    if (parceiros.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={24} className="text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">Nenhum parceiro cadastrado.</p>
                <p className="text-slate-400 text-sm mt-1">Use o formulário acima para adicionar o primeiro.</p>
            </div>
        );
    }

    if (filtrados.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                <p className="text-slate-500">Nenhum parceiro encontrado para os filtros selecionados.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Parceiros cadastrados</h2>
                <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                    {filtrados.length} {filtrados.length === 1 ? 'registro' : 'registros'}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                            <th className="px-6 py-3 font-semibold uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 font-semibold uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 font-semibold uppercase tracking-wider text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtrados.map((parceiro) => (
                            <tr key={parceiro.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold
                                            ${parceiro.tipo === 'Cliente' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                                            {parceiro.nome[0].toUpperCase()}
                                        </div>
                                        <span className="text-slate-800 font-medium text-sm">{parceiro.nome}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <TipoBadge tipo={parceiro.tipo} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                                        <button onClick={() => onEditar(parceiro)} title="Editar parceiro"
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => onDeletar(parceiro)} title="Excluir parceiro"
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Página principal ───────────────────────────────────────────
export default function ParceirosPage() {
    const { toast } = useToast();
    const [parceiros, setParceiros] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [filtro, setFiltro] = useState({ busca: '', tipo: 'Todos' });

    // Estado do ConfirmModal
    const [confirm, setConfirm] = useState({ isOpen: false, parceiro: null });
    // Estado do modal de edição
    const [editando, setEditando] = useState(null);

    const carregar = useCallback(async () => {
        try {
            const data = await parceirosAPI.listar();
            setParceiros(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(`Erro ao carregar parceiros: ${err.message}`);
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const handleDeletarSolicitado = (parceiro) => {
        setConfirm({ isOpen: true, parceiro });
    };

    const handleDeletarConfirmado = async () => {
        const { parceiro } = confirm;
        setConfirm({ isOpen: false, parceiro: null });
        try {
            await parceirosAPI.deletar(parceiro.id);   // BUG 1 FIX
            toast.success(`Parceiro "${parceiro.nome}" removido.`);
            carregar();
        } catch (err) {
            toast.error(`Falha ao excluir: ${err.message}`);
        }
    };

    const totalClientes = parceiros.filter((p) => p.tipo === 'Cliente').length;
    const totalFornecedores = parceiros.filter((p) => p.tipo === 'Fornecedor').length;

    return (
        <div>
            {/* ConfirmModal — FEATURE 1 */}
            <ConfirmModal
                isOpen={confirm.isOpen}
                title="Excluir parceiro"
                message={`Deseja realmente excluir o parceiro "${confirm.parceiro?.nome}"? Esta ação não pode ser desfeita.`}
                danger
                onConfirm={handleDeletarConfirmado}
                onCancel={() => setConfirm({ isOpen: false, parceiro: null })}
            />

            {/* Modal de edição — FEATURE 2 */}
            {editando && (
                <ModalEdicaoParceiro
                    parceiro={editando}
                    onSalvo={() => { setEditando(null); carregar(); }}
                    onFechar={() => setEditando(null)}
                />
            )}

            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cadastro de Parceiros</h1>
                <p className="text-slate-500 mt-1 text-sm">Gerencie seus clientes e fornecedores em um só lugar.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total de Parceiros', value: parceiros.length, icon: <Users size={22} />, color: 'indigo' },
                    { label: 'Clientes', value: totalClientes, icon: <UserCheck size={22} />, color: 'blue' },
                    { label: 'Fornecedores', value: totalFornecedores, icon: <Building2 size={22} />, color: 'violet' },
                ].map((card) => (
                    <div key={card.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                        <div className={`p-2.5 rounded-lg bg-${card.color}-50 text-${card.color}-600`}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                            <p className="text-2xl font-bold text-slate-800">{carregando ? '—' : card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <FormularioParceiro onAdicionado={carregar} />

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={filtro.busca}
                        onChange={(e) => setFiltro((f) => ({ ...f, busca: e.target.value }))}
                        placeholder="Buscar por nome..."
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                </div>
                <div className="flex gap-2">
                    {['Todos', 'Cliente', 'Fornecedor'].map((t) => (
                        <button key={t}
                            onClick={() => setFiltro((f) => ({ ...f, tipo: t }))}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border
                                ${filtro.tipo === t
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {carregando ? (
                <div className="flex items-center justify-center py-16">
                    <span className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="ml-3 text-slate-500 text-sm">Carregando parceiros...</span>
                </div>
            ) : (
                <ListaParceiros
                    parceiros={parceiros}
                    filtro={filtro}
                    onEditar={setEditando}
                    onDeletar={handleDeletarSolicitado}
                />
            )}
        </div>
    );
}