// ============================================================
//  src/pages/ContasCorrentesPage.jsx
//  CRUD de Contas Correntes — tabela + modal de criação/edição
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    PlusCircle, Trash2, Pencil, X, Check, Search,
    Landmark, DollarSign, ArrowRightLeft
} from 'lucide-react';
import { contasCorrentesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const inputCls =
    'w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm ' +
    'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white';

// ─────────────────────────────────────────────────────────────
//  Modal de criação / edição
// ─────────────────────────────────────────────────────────────
function ModalContaCorrente({ contaCorrente, onSalvo, onFechar }) {
    const { toast } = useToast();
    const isEdit = !!contaCorrente;
    const overlayRef = useRef(null);

    const [form, setForm] = useState({
        descricao: contaCorrente?.descricao ?? '',
        saldo: contaCorrente?.saldo != null ? String(contaCorrente.saldo) : '0',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const esc = (e) => { if (e.key === 'Escape') onFechar(); };
        document.addEventListener('keydown', esc);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', esc);
        };
    }, [onFechar]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.descricao.trim()) { toast.error('Informe a descrição.'); return; }

        setLoading(true);
        try {
            const dados = {
                descricao: form.descricao.trim(),
                saldo: parseFloat(form.saldo) || 0,
            };
            if (isEdit) {
                await contasCorrentesAPI.atualizar(contaCorrente.id, dados);
                toast.success('Conta corrente atualizada!');
            } else {
                await contasCorrentesAPI.criar(dados);
                toast.success('Conta corrente criada!');
            }
            onSalvo();
        } catch (err) {
            toast.error(`Erro: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onFechar(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,15,26,.55)', backdropFilter: 'blur(3px)' }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                style={{ animation: 'ccModalIn .22s cubic-bezier(.22,1,.36,1) both' }}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        {isEdit ? <Pencil size={16} className="text-indigo-600" /> : <PlusCircle size={16} className="text-indigo-600" />}
                        {isEdit ? 'Editar Conta Corrente' : 'Nova Conta Corrente'}
                    </h2>
                    <button onClick={onFechar} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
                        <input
                            type="text"
                            value={form.descricao}
                            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                            className={inputCls}
                            placeholder="Ex: Banco do Brasil, Nubank..."
                            maxLength={80}
                            autoFocus
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Inicial (R$)</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={form.saldo}
                                onChange={(e) => setForm((f) => ({ ...f, saldo: e.target.value }))}
                                className={`${inputCls} pl-10`}
                                placeholder="0,00"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onFechar}
                            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading || !form.descricao.trim()}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                            {loading
                                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                : <Check size={15} />}
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`@keyframes ccModalIn{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:none}}`}</style>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Modal de Transferência
// ─────────────────────────────────────────────────────────────
function ModalTransferencia({ contas, onSalvo, onFechar }) {
    const { toast } = useToast();
    const overlayRef = useRef(null);

    const [form, setForm] = useState({
        conta_origem_id: '',
        conta_destino_id: '',
        valor: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const esc = (e) => { if (e.key === 'Escape') onFechar(); };
        document.addEventListener('keydown', esc);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', esc);
        };
    }, [onFechar]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.conta_origem_id || !form.conta_destino_id) return toast.error('Selecione as contas.');
        if (!form.valor || parseFloat(form.valor) <= 0) return toast.error('Informe um valor válido.');
        if (form.conta_origem_id === form.conta_destino_id) return toast.error('As contas devem ser diferentes.');

        setLoading(true);
        try {
            await contasCorrentesAPI.transferir({
                conta_origem_id: parseInt(form.conta_origem_id, 10),
                conta_destino_id: parseInt(form.conta_destino_id, 10),
                valor: parseFloat(form.valor),
            });
            toast.success('Transferência realizada com sucesso!');
            onSalvo();
        } catch (err) {
            toast.error(`Erro: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const saldoOrigem = contas.find(c => c.id === parseInt(form.conta_origem_id))?.saldo || 0;

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onFechar(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,15,26,.55)', backdropFilter: 'blur(3px)' }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                style={{ animation: 'ccModalIn .22s cubic-bezier(.22,1,.36,1) both' }}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <ArrowRightLeft size={16} className="text-indigo-600" />
                        Nova Transferência
                    </h2>
                    <button onClick={onFechar} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Conta de Origem *</label>
                        <select
                            value={form.conta_origem_id}
                            onChange={(e) => setForm(f => ({ ...f, conta_origem_id: e.target.value }))}
                            className={inputCls}
                            required
                        >
                            <option value="">Selecione...</option>
                            {contas.map(c => (
                                <option key={c.id} value={c.id}>{c.descricao}</option>
                            ))}
                        </select>
                        {form.conta_origem_id && (
                            <p className="text-xs text-slate-500 mt-1">Saldo disponível: R$ {Number(saldoOrigem).toFixed(2)}</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Conta de Destino *</label>
                        <select
                            value={form.conta_destino_id}
                            onChange={(e) => setForm(f => ({ ...f, conta_destino_id: e.target.value }))}
                            className={inputCls}
                            required
                        >
                            <option value="">Selecione...</option>
                            {contas.map(c => (
                                <option 
                                    key={c.id} 
                                    value={c.id} 
                                    disabled={String(c.id) === String(form.conta_origem_id)}
                                >
                                    {c.descricao}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor da Transferência (R$) *</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={form.valor}
                                onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                                className={`${inputCls} pl-10`}
                                placeholder="0,00"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onFechar}
                            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading || !form.conta_origem_id || !form.conta_destino_id || !form.valor}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                            {loading
                                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                : <Check size={15} />}
                            {loading ? 'Transferindo...' : 'Transferir'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Página principal
// ─────────────────────────────────────────────────────────────
export default function ContasCorrentesPage() {
    const { toast } = useToast();

    const [contas, setContas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [busca, setBusca] = useState('');

    // modal de criação/edição
    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState(null);

    // modal de transferência
    const [modalTransferenciaAberto, setModalTransferenciaAberto] = useState(false);

    // confirm de exclusão
    const [confirm, setConfirm] = useState({ isOpen: false, conta: null });

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const data = await contasCorrentesAPI.listar();
            setContas(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(`Erro ao carregar contas correntes: ${err.message}`);
        } finally {
            setCarregando(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { carregar(); }, [carregar]);

    const handleEditar = (conta) => {
        setEditando(conta);
        setModalAberto(true);
    };

    const handleNovo = () => {
        setEditando(null);
        setModalAberto(true);
    };

    const handleSalvo = () => {
        setModalAberto(false);
        setEditando(null);
        carregar();
    };

    const handleDeletarSolicitado = (conta) => {
        setConfirm({ isOpen: true, conta });
    };

    const handleDeletarConfirmado = async () => {
        const { conta } = confirm;
        setConfirm({ isOpen: false, conta: null });
        try {
            await contasCorrentesAPI.deletar(conta.id);
            toast.success(`Conta corrente "${conta.descricao}" removida.`);
            carregar();
        } catch (err) {
            toast.error(`Falha ao excluir: ${err.message}`);
        }
    };

    const filtradas = contas.filter((c) =>
        (c.descricao ?? '').toLowerCase().includes(busca.toLowerCase())
    );

    const totalSaldo = contas.reduce((s, c) => s + Number(c.saldo ?? 0), 0);

    return (
        <div>
            <ConfirmModal
                isOpen={confirm.isOpen}
                title="Excluir conta corrente"
                message={`Deseja realmente excluir "${confirm.conta?.descricao}"? Esta ação não pode ser desfeita.`}
                danger
                onConfirm={handleDeletarConfirmado}
                onCancel={() => setConfirm({ isOpen: false, conta: null })}
            />

            {modalAberto && (
                <ModalContaCorrente
                    contaCorrente={editando}
                    onSalvo={handleSalvo}
                    onFechar={() => { setModalAberto(false); setEditando(null); }}
                />
            )}

            {modalTransferenciaAberto && (
                <ModalTransferencia
                    contas={contas}
                    onSalvo={() => { setModalTransferenciaAberto(false); carregar(); }}
                    onFechar={() => setModalTransferenciaAberto(false)}
                />
            )}

            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Contas Correntes</h1>
                    <p className="text-slate-500 mt-1 text-sm">Gerencie suas contas bancárias e carteiras.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setModalTransferenciaAberto(true)}
                        className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm">
                        <ArrowRightLeft size={16} />
                        <span className="hidden sm:inline">Transferir</span>
                        <span className="sm:hidden">Transferir</span>
                    </button>
                    <button onClick={handleNovo}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-indigo-200">
                        <PlusCircle size={16} />
                        <span className="hidden sm:inline">Nova Conta</span>
                        <span className="sm:hidden">Nova</span>
                    </button>
                </div>
            </header>

            {/* Card de resumo */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6 flex items-center gap-4 w-fit">
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600"><Landmark size={22} /></div>
                <div>
                    <p className="text-xs text-slate-500 font-medium">Saldo Total ({contas.length} {contas.length === 1 ? 'conta' : 'contas'})</p>
                    <p className={`text-2xl font-bold ${totalSaldo >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                        R$ {totalSaldo.toFixed(2)}
                    </p>
                </div>
            </div>

            {carregando ? (
                <div className="flex items-center justify-center py-16">
                    <span className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="ml-3 text-slate-500 text-sm">Carregando contas correntes...</span>
                </div>
            ) : contas.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Landmark size={24} className="text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Nenhuma conta corrente cadastrada.</p>
                    <p className="text-slate-400 text-sm mt-1">Clique em "Nova Conta" para adicionar.</p>
                </div>
            ) : (
                <>
                    {/* Busca */}
                    {contas.length > 3 && (
                        <div className="mb-4">
                            <div className="relative max-w-sm">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    placeholder="Buscar conta corrente..."
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </div>
                        </div>
                    )}

                    {/* Tabela */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                                        <th className="px-6 py-3 font-semibold uppercase tracking-wider">Descrição</th>
                                        <th className="px-6 py-3 font-semibold uppercase tracking-wider">Saldo</th>
                                        <th className="px-6 py-3 font-semibold uppercase tracking-wider text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtradas.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-sm">
                                                Nenhuma conta corrente encontrada para "{busca}".
                                            </td>
                                        </tr>
                                    ) : filtradas.map((conta) => {
                                        const saldo = Number(conta.saldo ?? 0);
                                        return (
                                            <tr key={conta.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                            <Landmark size={14} className="text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{conta.descricao}</p>
                                                            <p className="text-xs text-slate-400">#{conta.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`text-sm font-semibold ${saldo >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                                        R$ {saldo.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditar(conta)} title="Editar"
                                                            className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button onClick={() => handleDeletarSolicitado(conta)} title="Excluir"
                                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
