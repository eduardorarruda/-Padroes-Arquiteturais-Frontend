// ============================================================
//  src/pages/ContasPage.jsx  — v3
//  Adaptado ao backend atualizado:
//  · Campo `tipo` obrigatório: "PAGAR" | "RECEBER"
//  · Endpoints /pagar e /receber
//  · Abas de navegação por tipo
//  · Modal de edição com todos os campos
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    PlusCircle, Trash2, CheckCircle, Clock, DollarSign,
    AlertCircle, ArrowLeft, Tag, Users, CalendarDays,
    FileText, TrendingDown, TrendingUp, Search, Pencil, X,
    ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react';
import { contasAPI, categoriasAPI, parceirosAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

// ─────────────────────────────────────────────────────────────
//  Constantes de tipo
// ─────────────────────────────────────────────────────────────
const TIPOS = {
    PAGAR: { label: 'A Pagar', color: 'red', icon: <ArrowDownCircle size={14} /> },
    RECEBER: { label: 'A Receber', color: 'emerald', icon: <ArrowUpCircle size={14} /> },
};

// ─────────────────────────────────────────────────────────────
//  Helpers de estilo
// ─────────────────────────────────────────────────────────────
const inputCls =
    'w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm ' +
    'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white';

const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';

// ─────────────────────────────────────────────────────────────
//  Cards de resumo
// ─────────────────────────────────────────────────────────────
function ResumoCards({ contas }) {
    const pagar = contas.filter((c) => c.tipo === 'PAGAR');
    const receber = contas.filter((c) => c.tipo === 'RECEBER');
    const pendente = contas.filter((c) => c.status === 'Pendente');

    const somaPagar = pagar.reduce((s, c) => s + Number(c.valor), 0);
    const somaReceber = receber.reduce((s, c) => s + Number(c.valor), 0);
    const somaPendente = pendente.reduce((s, c) => s + Number(c.valor), 0);
    const saldo = somaReceber - somaPagar;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={22} /></div>
                <div>
                    <p className="text-xs text-slate-500 font-medium">A Pagar ({pagar.length})</p>
                    <p className="text-2xl font-bold text-red-600">R$ {somaPagar.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={22} /></div>
                <div>
                    <p className="text-xs text-slate-500 font-medium">A Receber ({receber.length})</p>
                    <p className="text-2xl font-bold text-emerald-600">R$ {somaReceber.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg"><Clock size={22} /></div>
                <div>
                    <p className="text-xs text-slate-500 font-medium">Pendentes ({pendente.length})</p>
                    <p className="text-2xl font-bold text-amber-600">R$ {somaPendente.toFixed(2)}</p>
                </div>
            </div>

            <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4`}>
                <div className={`p-2.5 rounded-lg ${saldo >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>
                    <DollarSign size={22} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-medium">Saldo Previsto</p>
                    <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                        {saldo >= 0 ? '+' : ''}R$ {saldo.toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Badge de tipo
// ─────────────────────────────────────────────────────────────
function TipoBadge({ tipo }) {
    const t = TIPOS[tipo] ?? { label: tipo, color: 'slate', icon: null };
    const colors = {
        red: 'bg-red-50 text-red-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        slate: 'bg-slate-100 text-slate-600',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colors[t.color]}`}>
            {t.icon}{t.label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────
//  Grid de contas
// ─────────────────────────────────────────────────────────────
function ListaContas({ contas, catMap, parMap, onEditar, onDeletar }) {
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroTipo, setFiltroTipo] = useState('Todos');

    const filtradas = contas.filter((c) => {
        const matchBusca = c.descricao.toLowerCase().includes(busca.toLowerCase());
        const matchStatus = filtroStatus === 'Todos' || c.status === filtroStatus;
        const matchTipo = filtroTipo === 'Todos' || c.tipo === filtroTipo;
        return matchBusca && matchStatus && matchTipo;
    });

    if (contas.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText size={24} className="text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">Nenhuma conta lançada ainda.</p>
                <p className="text-slate-400 text-sm mt-1">Clique em "Novo Lançamento" para começar.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Filtros */}
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 flex-wrap items-center">
                {/* Busca */}
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por descrição..."
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                </div>

                {/* Filtro tipo */}
                <div className="flex gap-1 flex-shrink-0">
                    {['Todos', 'PAGAR', 'RECEBER'].map((t) => (
                        <button key={t}
                            onClick={() => setFiltroTipo(t)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                ${filtroTipo === t
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                            {t === 'Todos' ? 'Todos' : t === 'PAGAR' ? '↓ Pagar' : '↑ Receber'}
                        </button>
                    ))}
                </div>

                {/* Filtro status */}
                <div className="flex gap-1 flex-shrink-0">
                    {['Todos', 'Pendente', 'Pago'].map((s) => (
                        <button key={s}
                            onClick={() => setFiltroStatus(s)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                ${filtroStatus === s
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                            {s}
                        </button>
                    ))}
                </div>

                <span className="text-xs text-slate-400 flex-shrink-0">
                    {filtradas.length} {filtradas.length === 1 ? 'registro' : 'registros'}
                </span>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                            <th className="px-5 py-3 font-semibold uppercase tracking-wider">Tipo</th>
                            <th className="px-5 py-3 font-semibold uppercase tracking-wider">Descrição</th>
                            <th className="px-5 py-3 font-semibold uppercase tracking-wider hidden md:table-cell">Categoria</th>
                            <th className="px-5 py-3 font-semibold uppercase tracking-wider hidden lg:table-cell">Parceiro</th>
                            <th className="px-5 py-3 font-semibold uppercase tracking-wider">Vencimento</th>
                            <th className="px-5 py-3 font-semibold uppercase tracking-wider">Valor</th>
                            <th className="px-5 py-3 font-semibold uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtradas.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-5 py-8 text-center text-slate-400 text-sm">
                                    Nenhuma conta encontrada para os filtros aplicados.
                                </td>
                            </tr>
                        ) : filtradas.map((conta) => {
                            const catNome = conta.categoria_id
                                ? (catMap[conta.categoria_id]?.descricao ?? `#${conta.categoria_id}`)
                                : null;
                            const parNome = conta.parceiro_id
                                ? (parMap[conta.parceiro_id]?.nome ?? `#${conta.parceiro_id}`)
                                : null;

                            return (
                                <tr key={conta.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <TipoBadge tipo={conta.tipo} />
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <p className="text-sm font-medium text-slate-800">{conta.descricao}</p>
                                    </td>
                                    <td className="px-5 py-3.5 hidden md:table-cell">
                                        {catNome
                                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"><Tag size={10} />{catNome}</span>
                                            : <span className="text-slate-300 text-xs">—</span>}
                                    </td>
                                    <td className="px-5 py-3.5 hidden lg:table-cell">
                                        {parNome
                                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium"><Users size={10} />{parNome}</span>
                                            : <span className="text-slate-300 text-xs">—</span>}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-sm text-slate-600">
                                            {new Date(conta.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-sm font-semibold ${conta.tipo === 'RECEBER' ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {conta.tipo === 'RECEBER' ? '+' : '-'} R$ {Number(conta.valor).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                      ${conta.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {conta.status === 'Pago' ? <CheckCircle size={11} /> : <Clock size={11} />}
                                            {conta.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => onEditar(conta)} title="Editar lançamento"
                                                className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => onDeletar(conta.id, conta.descricao)} title="Excluir lançamento"
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
    );
}

// ─────────────────────────────────────────────────────────────
//  Campos do formulário (reutilizado em Novo e Editar)
// ─────────────────────────────────────────────────────────────
function CamposFormulario({ form, set, onTipoChange, categorias, parceiros, loadingSelects }) {
    return (
        <>
            {/* ── Seção 1: Informações principais ──────────────── */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <FileText size={14} className="text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                        Informações Principais
                        <span className="ml-2 text-red-400 font-normal normal-case text-xs">* obrigatório</span>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* TIPO — campo obrigatório, ocupa col inteira */}
                    <div className="md:col-span-2">
                        <label className={labelCls}>
                            Tipo da Conta <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                            {[
                                { value: 'PAGAR', label: 'Conta a Pagar', icon: <ArrowDownCircle size={16} />, border: 'border-red-400 bg-red-50 text-red-700', hover: 'border-slate-300 hover:bg-red-50/40' },
                                { value: 'RECEBER', label: 'Conta a Receber', icon: <ArrowUpCircle size={16} />, border: 'border-emerald-400 bg-emerald-50 text-emerald-700', hover: 'border-slate-300 hover:bg-emerald-50/40' },
                            ].map((opt) => (
                                <label key={opt.value}
                                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all select-none
                    ${form.tipo === opt.value ? opt.border : `border-slate-200 text-slate-600 ${opt.hover}`}`}>
                                    <input type="radio" name="tipo_conta" value={opt.value}
                                        checked={form.tipo === opt.value}
                                        onChange={onTipoChange}
                                        className="sr-only" />
                                    {opt.icon}
                                    <span className="text-sm font-semibold">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Descrição — col-span 2 */}
                    <div className="md:col-span-2">
                        <label className={labelCls}>
                            Descrição <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.descricao}
                            onChange={set('descricao')}
                            className={inputCls}
                            placeholder="Ex: Aluguel, Conta de Luz, Recebimento Cliente..."
                            maxLength={120}
                            required
                        />
                    </div>

                    {/* Valor */}
                    <div>
                        <label className={labelCls}>
                            Valor (R$) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">R$</span>
                            <input
                                type="number" step="0.01" min="0.01"
                                value={form.valor}
                                onChange={set('valor')}
                                className={`${inputCls} pl-10`}
                                placeholder="0,00"
                                required
                            />
                        </div>
                    </div>

                    {/* Vencimento */}
                    <div>
                        <label className={labelCls}>
                            Data de Vencimento <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <CalendarDays size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="date"
                                value={form.data_vencimento}
                                onChange={set('data_vencimento')}
                                className={`${inputCls} pl-10`}
                                required
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
                        <label className={labelCls}>Status</label>
                        <div className="flex gap-3">
                            {['Pendente', 'Pago'].map((s) => (
                                <label key={s}
                                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm font-medium select-none
                    ${form.status === s
                                            ? s === 'Pendente' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                            : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                                    <input type="radio" name="status_form" value={s}
                                        checked={form.status === s}
                                        onChange={set('status')}
                                        className="sr-only" />
                                    {s === 'Pendente' ? <Clock size={15} /> : <CheckCircle size={15} />}
                                    {s}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Seção 2: Relacionamentos ──────────────────────── */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Tag size={14} className="text-slate-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                        Relacionamentos
                        <span className="ml-2 text-slate-400 font-normal normal-case text-xs">opcional</span>
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Categoria */}
                    <div>
                        <label className={labelCls}>
                            <span className="flex items-center gap-1.5"><Tag size={13} className="text-indigo-500" />Categoria</span>
                        </label>
                        {loadingSelects ? (
                            <div className={`${inputCls} flex items-center gap-2 text-slate-400`}>
                                <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />Carregando...
                            </div>
                        ) : (
                            <select value={form.categoria_id} onChange={set('categoria_id')} className={inputCls}>
                                <option value="">— Sem categoria —</option>
                                {categorias.map((c) => <option key={c.id} value={c.id}>{c.descricao}</option>)}
                            </select>
                        )}
                    </div>
                    {/* Parceiro — filtrado pelo tipo da conta */}
                    <div>
                        <label className={labelCls}>
                            <span className="flex items-center gap-1.5">
                                <Users size={13} className="text-indigo-500" />
                                {form.tipo === 'PAGAR' ? 'Fornecedor' : form.tipo === 'RECEBER' ? 'Cliente' : 'Parceiro'}
                            </span>
                        </label>
                        {loadingSelects ? (
                            <div className={`${inputCls} flex items-center gap-2 text-slate-400`}>
                                <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />Carregando...
                            </div>
                        ) : (() => {
                            // PAGAR → mostra apenas Fornecedores | RECEBER → mostra apenas Clientes
                            const tipoFiltro = form.tipo === 'PAGAR' ? 'Fornecedor' : 'Cliente';
                            const parceirosFiltrados = form.tipo
                                ? parceiros.filter((p) => p.tipo === tipoFiltro)
                                : parceiros;
                            const placeholder = form.tipo === 'PAGAR'
                                ? '— Sem fornecedor —'
                                : form.tipo === 'RECEBER'
                                    ? '— Sem cliente —'
                                    : '— Sem parceiro —';
                            return (
                                <select value={form.parceiro_id} onChange={set('parceiro_id')} className={inputCls}>
                                    <option value="">{placeholder}</option>
                                    {parceirosFiltrados.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nome}</option>
                                    ))}
                                </select>
                            );
                        })()}
                        {!loadingSelects && form.tipo && (() => {
                            const tipoFiltro = form.tipo === 'PAGAR' ? 'Fornecedor' : 'Cliente';
                            const count = parceiros.filter((p) => p.tipo === tipoFiltro).length;
                            if (count === 0) return (
                                <p className="text-xs text-slate-400 mt-1">
                                    Nenhum {tipoFiltro.toLowerCase()} cadastrado.
                                </p>
                            );
                            return null;
                        })()}
                    </div>
                </div>
            </section>
        </>
    );
}

// ─────────────────────────────────────────────────────────────
//  Modal de edição
// ─────────────────────────────────────────────────────────────
function ModalEdicao({ conta, categorias, parceiros, loadingSelects, onSalvo, onFechar }) {
    const { toast } = useToast();
    const overlayRef = useRef(null);

    const [form, setForm] = useState({
        tipo: conta.tipo ?? 'PAGAR',
        descricao: conta.descricao ?? '',
        valor: String(conta.valor) ?? '',
        data_vencimento: conta.data_vencimento ?? '',
        status: conta.status ?? 'Pendente',
        categoria_id: conta.categoria_id != null ? String(conta.categoria_id) : '',
        parceiro_id: conta.parceiro_id != null ? String(conta.parceiro_id) : '',
    });
    const [submitting, setSubmitting] = useState(false);

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    // Ao mudar o tipo, limpa parceiro se não pertencer ao novo tipo
    const handleTipoChange = (e) => {
        const novoTipo = e.target.value;
        const tipoFiltro = novoTipo === 'PAGAR' ? 'Fornecedor' : 'Cliente';
        const parceiroAtual = parceiros.find((p) => String(p.id) === String(form.parceiro_id));
        const deveResetar = parceiroAtual && parceiroAtual.tipo !== tipoFiltro;
        setForm((f) => ({ ...f, tipo: novoTipo, ...(deveResetar ? { parceiro_id: '' } : {}) }));
    };
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const esc = (e) => { if (e.key === 'Escape') onFechar(); };
        document.addEventListener('keydown', esc);
        return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', esc); };
    }, [onFechar]);

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tipo) { toast.error('Selecione o tipo da conta.'); return; }
    if (!form.descricao.trim()) { toast.error('Informe a descrição.'); return; }
    if (!form.valor || parseFloat(form.valor) <= 0) { toast.error('Valor deve ser > 0.'); return; }
    if (!form.data_vencimento) { toast.error('Informe a data de vencimento.'); return; }

    setSubmitting(true);
    try {
        await contasAPI.atualizar(conta.id, {
            tipo: form.tipo,
            descricao: form.descricao.trim(),
            valor: parseFloat(form.valor),
            data_vencimento: form.data_vencimento,
            status: form.status,
            categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
            parceiro_id: form.parceiro_id ? Number(form.parceiro_id) : null,
        });
        toast.success('Lançamento atualizado com sucesso!');
        onSalvo();
    } catch (err) {
        toast.error(`Erro ao salvar: ${err.message}`);
    } finally {
        setSubmitting(false);
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
            className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
            style={{ animation: 'modalIn .25s cubic-bezier(.22,1,.36,1) both' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white rounded-t-2xl flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Pencil size={15} className="text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Editar Lançamento</h2>
                        <p className="text-xs text-slate-500">#{conta.id} — {conta.descricao}</p>
                    </div>
                </div>
                <button onClick={onFechar} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Corpo com scroll */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">
                    <CamposFormulario
                        form={form} set={set} onTipoChange={handleTipoChange}
                        categorias={categorias} parceiros={parceiros}
                        loadingSelects={loadingSelects}
                    />
                </div>
                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white rounded-b-2xl flex-shrink-0">
                    <button type="button" onClick={onFechar}
                        className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" disabled={submitting}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
                        {submitting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle size={15} />}
                        {submitting ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
        <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}`}</style>
    </div>
);
}

// ─────────────────────────────────────────────────────────────
//  Formulário de novo lançamento (tela cheia)
// ─────────────────────────────────────────────────────────────
function FormularioNovoLancamento({ categorias, parceiros, loadingSelects, onSalvo, onCancelar }) {
    const { toast } = useToast();
    const [form, setForm] = useState({
        tipo: 'PAGAR', descricao: '', valor: '', data_vencimento: '',
        status: 'Pendente', categoria_id: '', parceiro_id: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    // Ao mudar o tipo, limpa o parceiro se ele não pertencer ao novo tipo
    const handleTipoChange = (e) => {
        const novoTipo = e.target.value;
        const tipoFiltro = novoTipo === 'PAGAR' ? 'Fornecedor' : 'Cliente';
        const parceiroAtual = parceiros.find((p) => String(p.id) === String(form.parceiro_id));
        const deveResetar = parceiroAtual && parceiroAtual.tipo !== tipoFiltro;
        setForm((f) => ({ ...f, tipo: novoTipo, ...(deveResetar ? { parceiro_id: '' } : {}) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.tipo) { toast.error('Selecione o tipo da conta.'); return; }
        if (!form.descricao.trim()) { toast.error('Informe a descrição da conta.'); return; }
        if (!form.valor || parseFloat(form.valor) <= 0) { toast.error('O valor deve ser maior que zero.'); return; }
        if (!form.data_vencimento) { toast.error('Informe a data de vencimento.'); return; }

        setSubmitting(true);
        try {
            await contasAPI.criar({
                tipo: form.tipo,
                descricao: form.descricao.trim(),
                valor: parseFloat(form.valor),
                data_vencimento: form.data_vencimento,
                status: form.status,
                ...(form.categoria_id ? { categoria_id: Number(form.categoria_id) } : {}),
                ...(form.parceiro_id ? { parceiro_id: Number(form.parceiro_id) } : {}),
            });
            toast.success('Conta lançada com sucesso!');
            onSalvo();
        } catch (err) {
            toast.error(`Erro ao lançar conta: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onCancelar}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Voltar">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Novo Lançamento</h2>
                    <p className="text-xs text-slate-500">Preencha os dados da conta</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <CamposFormulario
                    form={form} set={set} onTipoChange={handleTipoChange}
                    categorias={categorias} parceiros={parceiros}
                    loadingSelects={loadingSelects}
                />
                <div className="flex items-center justify-end gap-3 mt-6">
                    <button type="button" onClick={onCancelar}
                        className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" disabled={submitting}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200">
                        {submitting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <DollarSign size={15} />}
                        {submitting ? 'Salvando...' : 'Salvar Lançamento'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Página principal
// ─────────────────────────────────────────────────────────────
export default function ContasPage() {
    const { toast } = useToast();

    const [view, setView] = useState('list');
    const [contas, setContas] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const [categorias, setCategorias] = useState([]);
    const [parceiros, setParceiros] = useState([]);
    const [loadingSelects, setLoadingSelects] = useState(true);

    const catMap = Object.fromEntries(categorias.map((c) => [c.id, c]));
    const parMap = Object.fromEntries(parceiros.map((p) => [p.id, p]));

    const [contaEditando, setContaEditando] = useState(null);

    // Carrega categorias e parceiros uma vez
    useEffect(() => {
        Promise.all([categoriasAPI.listar(), parceirosAPI.listar()])
            .then(([cats, pars]) => {
                setCategorias(Array.isArray(cats) ? cats : []);
                setParceiros(Array.isArray(pars) ? pars : []);
            })
            .catch(() => toast.warning('Não foi possível carregar categorias/parceiros.'))
            .finally(() => setLoadingSelects(false));
    }, []);

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const data = await contasAPI.listar();
            setContas(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(`Erro ao carregar contas: ${err.message}`);
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const handleDeletar = async (id, descricao) => {
        if (!window.confirm(`Deseja realmente excluir a conta "${descricao}"?`)) return;
        try {
            await contasAPI.deletar(id);
            toast.success('Conta excluída com sucesso.');
            carregar();
        } catch (err) {
            toast.error(`Falha ao excluir: ${err.message}`);
        }
    };

    // ── VIEW: Formulário ──────────────────────────────────────
    if (view === 'form') {
        return (
            <div>
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lançamento de Contas</h1>
                    <p className="text-slate-500 mt-1 text-sm">Registre uma nova conta a pagar ou receber.</p>
                </header>
                <FormularioNovoLancamento
                    categorias={categorias} parceiros={parceiros} loadingSelects={loadingSelects}
                    onSalvo={() => { setView('list'); carregar(); }}
                    onCancelar={() => setView('list')}
                />
            </div>
        );
    }

    // ── VIEW: Listagem ────────────────────────────────────────
    return (
        <div>
            {contaEditando && (
                <ModalEdicao
                    conta={contaEditando}
                    categorias={categorias} parceiros={parceiros} loadingSelects={loadingSelects}
                    onSalvo={() => { setContaEditando(null); carregar(); }}
                    onFechar={() => setContaEditando(null)}
                />
            )}

            <header className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lançamento de Contas</h1>
                    <p className="text-slate-500 mt-1 text-sm">Controle suas contas a pagar e a receber.</p>
                </div>
                <button
                    onClick={() => setView('form')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-indigo-200"
                >
                    <PlusCircle size={16} />
                    <span className="hidden sm:inline">Novo Lançamento</span>
                    <span className="sm:hidden">Novo</span>
                </button>
            </header>

            {carregando ? (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 h-20 animate-pulse" />
                        ))}
                    </div>
                    <div className="flex items-center justify-center py-16">
                        <span className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                        <span className="ml-3 text-slate-500 text-sm">Carregando contas...</span>
                    </div>
                </>
            ) : (
                <>
                    <ResumoCards contas={contas} />
                    <ListaContas
                        contas={contas}
                        catMap={catMap}
                        parMap={parMap}
                        onEditar={setContaEditando}
                        onDeletar={handleDeletar}
                    />
                </>
            )}
        </div>
    );
}