// ============================================================
//  src/pages/ContasPage.jsx  — corrigido
//  CORREÇÃO: set() helper estável via useCallback; nomes únicos
//  nos radio buttons para evitar conflito DOM entre modal e form.
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    PlusCircle, Trash2, CheckCircle, Clock, DollarSign,
    ArrowLeft, Tag, Users, CalendarDays, FileText,
    Search, Pencil, X, ArrowDownCircle, ArrowUpCircle,
    ChevronUp, ChevronDown, Download,
} from 'lucide-react';
import { contasAPI, categoriasAPI, parceirosAPI, contasCorrentesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import ResumoCards from '../components/ResumoCards';
import ConfirmModal from '../components/ConfirmModal';

// ─────────────────────────────────────────────────────────────
//  Constantes
// ─────────────────────────────────────────────────────────────
const TIPOS = {
    PAGAR: { label: 'A Pagar', color: 'red', icon: <ArrowDownCircle size={14} /> },
    RECEBER: { label: 'A Receber', color: 'emerald', icon: <ArrowUpCircle size={14} /> },
};

const inputCls =
    'w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm ' +
    'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white';

const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';

const PAGE_LIMIT = 20;

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
//  Cabeçalho de coluna ordenável
// ─────────────────────────────────────────────────────────────
function SortHeader({ col, label, sort, onSort }) {
    const active = sort.col === col;
    return (
        <th
            className="px-5 py-3 font-semibold uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors"
            onClick={() => onSort(col)}
        >
            <span className="flex items-center gap-1">
                {label}
                {active
                    ? sort.dir === 'asc'
                        ? <ChevronUp size={13} className="text-indigo-500" />
                        : <ChevronDown size={13} className="text-indigo-500" />
                    : <ChevronDown size={13} className="text-slate-300" />}
            </span>
        </th>
    );
}

// ─────────────────────────────────────────────────────────────
//  Exportar CSV
// ─────────────────────────────────────────────────────────────
function exportarCSV(contas, catMap, parMap) {
    const header = ['Tipo', 'Descrição', 'Categoria', 'Parceiro', 'Vencimento', 'Valor', 'Status'];
    const rows = contas.map((c) => [
        c.tipo,
        `"${(c.descricao ?? '').replace(/"/g, '""')}"`,
        catMap[c.categoria_id]?.descricao ?? '',
        parMap[c.parceiro_id]?.nome ?? '',
        c.data_vencimento,
        ((Number(c.valor)||0) + (Number(c.juros)||0) + (Number(c.multa)||0) + (Number(c.acrescimo)||0) - (Number(c.desconto)||0)).toFixed(2).replace('.', ','),
        c.status,
    ]);
    const csv = [header, ...rows].map((r) => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
//  Lista de contas (tabela)
// ─────────────────────────────────────────────────────────────
function ListaContas({ contas, catMap, parMap, onEditar, onDeletar, onBaixar }) {
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroTipo, setFiltroTipo] = useState('Todos');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [sort, setSort] = useState({ col: 'data_vencimento', dir: 'asc' });
    const [pagina, setPagina] = useState(1);

    const handleSort = (col) => {
        setSort((s) => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));
        setPagina(1);
    };

    const filtradas = contas.filter((c) => {
        const matchBusca = (c.descricao ?? '').toLowerCase().includes(busca.toLowerCase());
        const matchStatus = filtroStatus === 'Todos' || c.status === filtroStatus;
        const matchTipo = filtroTipo === 'Todos' || c.tipo === filtroTipo;
        const dt = c.data_vencimento ?? '';
        const matchInicio = !dataInicio || dt >= dataInicio;
        const matchFim = !dataFim || dt <= dataFim;
        return matchBusca && matchStatus && matchTipo && matchInicio && matchFim;
    });

    const sorted = [...filtradas].sort((a, b) => {
        let va = a[sort.col], vb = b[sort.col];
        if (sort.col === 'valor') { va = Number(va); vb = Number(vb); }
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sort.dir === 'asc' ? cmp : -cmp;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_LIMIT));
    const paginaAtual = Math.min(pagina, totalPages);
    const paginados = sorted.slice((paginaAtual - 1) * PAGE_LIMIT, paginaAtual * PAGE_LIMIT);

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
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
                    <div className="relative flex-1 min-w-48">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input type="text" value={busca}
                            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                            placeholder="Buscar por descrição..."
                            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                        {['Todos', 'PAGAR', 'RECEBER'].map((t) => (
                            <button key={t} onClick={() => { setFiltroTipo(t); setPagina(1); }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                                    ${filtroTipo === t ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                                {t === 'Todos' ? 'Todos' : t === 'PAGAR' ? '↓ Pagar' : '↑ Receber'}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                        {['Todos', 'Pendente', 'Pago'].map((s) => (
                            <button key={s} onClick={() => { setFiltroStatus(s); setPagina(1); }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                                    ${filtroStatus === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                        {filtradas.length} {filtradas.length === 1 ? 'registro' : 'registros'}
                    </span>
                </div>
                {/* Filtro de data */}
                <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-xs text-slate-500 font-medium">Vencimento:</span>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">De</label>
                        <input type="date" value={dataInicio}
                            onChange={(e) => { setDataInicio(e.target.value); setPagina(1); }}
                            className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">Até</label>
                        <input type="date" value={dataFim}
                            onChange={(e) => { setDataFim(e.target.value); setPagina(1); }}
                            className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                    </div>
                    {(dataInicio || dataFim) && (
                        <button onClick={() => { setDataInicio(''); setDataFim(''); }}
                            className="text-xs text-slate-400 hover:text-slate-600 underline">
                            Limpar datas
                        </button>
                    )}
                </div>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                            <SortHeader col="tipo" label="Tipo" sort={sort} onSort={handleSort} />
                            <SortHeader col="descricao" label="Descrição" sort={sort} onSort={handleSort} />
                            <th className="px-5 py-3 font-semibold uppercase tracking-wider hidden md:table-cell">Categoria</th>
                            <th className="px-5 py-3 font-semibold uppercase tracking-wider hidden lg:table-cell">Parceiro</th>
                            <SortHeader col="data_vencimento" label="Vencimento" sort={sort} onSort={handleSort} />
                            <SortHeader col="valor" label="Valor" sort={sort} onSort={handleSort} />
                            <SortHeader col="status" label="Status" sort={sort} onSort={handleSort} />
                            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginados.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-5 py-8 text-center text-slate-400 text-sm">
                                    Nenhuma conta encontrada para os filtros aplicados.
                                </td>
                            </tr>
                        ) : paginados.map((conta) => {
                            const catNome = conta.categoria_id ? (catMap[conta.categoria_id]?.descricao ?? `#${conta.categoria_id}`) : null;
                            const parNome = conta.parceiro_id ? (parMap[conta.parceiro_id]?.nome ?? `#${conta.parceiro_id}`) : null;
                            return (
                                <tr key={conta.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3.5"><TipoBadge tipo={conta.tipo} /></td>
                                    <td className="px-5 py-3.5"><p className="text-sm font-medium text-slate-800">{conta.descricao}</p></td>
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
                                        <span className={`text-sm font-semibold flex flex-col ${conta.tipo === 'RECEBER' ? 'text-emerald-700' : 'text-red-700'}`}>
                                            <span>{conta.tipo === 'RECEBER' ? '+' : '-'} R$ {((Number(conta.valor)||0) + (Number(conta.juros)||0) + (Number(conta.multa)||0) + (Number(conta.acrescimo)||0) - (Number(conta.desconto)||0)).toFixed(2)}</span>
                                            {((Number(conta.juros)||0) + (Number(conta.multa)||0) + (Number(conta.acrescimo)||0) > 0 || Number(conta.desconto) > 0) && (
                                                <span className="text-[10px] text-slate-400 font-normal">Orig: R$ {Number(conta.valor).toFixed(2)}</span>
                                            )}
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
                                            <button onClick={() => onEditar(conta)} title="Editar"
                                                className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => onDeletar(conta)} title="Excluir"
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={15} />
                                            </button>
                                            {conta.status === 'Pendente' && (
                                                <button onClick={() => onBaixar(conta)} title="Dar Baixa"
                                                    className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
                                                    <CheckCircle size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                    <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1}
                        className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
                        ← Anterior
                    </button>
                    <span className="text-xs text-slate-500">Página {paginaAtual} de {totalPages}</span>
                    <button onClick={() => setPagina((p) => Math.min(totalPages, p + 1))} disabled={paginaAtual === totalPages}
                        className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
                        Próxima →
                    </button>
                </div>
            )}

            {/* Exportar CSV */}
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
                <button onClick={() => exportarCSV(sorted, catMap, parMap)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 hover:border-indigo-300">
                    <Download size={13} />
                    Exportar CSV ({sorted.length} {sorted.length === 1 ? 'linha' : 'linhas'})
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  FormConta — campos compartilhados (novo + modal edição)
// ─────────────────────────────────────────────────────────────
function FormConta({ idPrefix, form, setForm, categorias, parceiros, contasCorrentes, loadingSelects }) {

    const handleChange = useCallback((field) => (e) => {
        const val = e.target.value;
        setForm((f) => ({ ...f, [field]: val }));
    }, [setForm]);

    const handleTipoChange = useCallback((e) => {
        const novoTipo = e.target.value;
        const tipoFiltro = novoTipo === 'PAGAR' ? 'Fornecedor' : 'Cliente';
        setForm((f) => {
            const parAtual = parceiros.find((p) => String(p.id) === String(f.parceiro_id));
            return {
                ...f,
                tipo: novoTipo,
                ...(parAtual && parAtual.tipo !== tipoFiltro ? { parceiro_id: '' } : {}),
            };
        });
    }, [setForm, parceiros]);

    const tipoFiltro = form.tipo === 'PAGAR' ? 'Fornecedor' : 'Cliente';
    const parceirosFiltrados = form.tipo ? parceiros.filter((p) => p.tipo === tipoFiltro) : parceiros;
    const parPlaceholder = form.tipo === 'PAGAR' ? '— Selecione o Fornecedor —'
        : form.tipo === 'RECEBER' ? '— Selecione o Cliente —'
            : '— Selecione —';

    return (
        <div className="flex flex-col gap-4">
            {/* ── Informações principais ───────────────────────── */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <FileText size={14} className="text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                        Informações do Lançamento
                        <span className="ml-2 text-red-400 font-normal normal-case text-xs">* campos obrigatórios</span>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Tipo */}
                    <div className="md:col-span-2">
                        <label className={labelCls}>Tipo da Conta <span className="text-red-500">*</span></label>
                        <div className="flex gap-3">
                            {[
                                {
                                    value: 'PAGAR',
                                    label: 'Conta a Pagar',
                                    icon: <ArrowDownCircle size={16} />,
                                    activeClass: 'border-red-400 bg-red-50 text-red-700',
                                },
                                {
                                    value: 'RECEBER',
                                    label: 'Conta a Receber',
                                    icon: <ArrowUpCircle size={16} />,
                                    activeClass: 'border-emerald-400 bg-emerald-50 text-emerald-700',
                                },
                            ].map((opt) => (
                                <label key={opt.value}
                                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all select-none
                                        ${form.tipo === opt.value ? opt.activeClass : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    <input
                                        type="radio"
                                        name={`${idPrefix}_tipo`}
                                        value={opt.value}
                                        checked={form.tipo === opt.value}
                                        onChange={handleTipoChange}
                                        className="sr-only"
                                    />
                                    {opt.icon}
                                    <span className="text-sm font-semibold">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Descrição */}
                    <div className="md:col-span-2">
                        <label className={labelCls}>Descrição <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={form.descricao}
                            onChange={handleChange('descricao')}
                            className={inputCls}
                            placeholder="Ex: Aluguel, Conta de Luz, Recebimento Cliente..."
                            maxLength={120}
                        />
                    </div>

                    {/* Valor Detalhado */}
                    <div className="md:col-span-2">
                        <label className={labelCls}>Valor Original (R$) <span className="text-red-500">*</span></label>
                        <div className="relative mb-5">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">R$</span>
                            <input
                                type="number" step="0.01" min="0.01"
                                value={form.valor}
                                onChange={handleChange('valor')}
                                className={`${inputCls} pl-10 border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500 text-base font-semibold`}
                                placeholder="0,00"
                            />
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Juros (R$)</label>
                                <input type="number" step="0.01" min="0" value={form.juros ?? ''} onChange={handleChange('juros')} className={`${inputCls} py-2`} placeholder="0,00" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Multa (R$)</label>
                                <input type="number" step="0.01" min="0" value={form.multa ?? ''} onChange={handleChange('multa')} className={`${inputCls} py-2`} placeholder="0,00" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Acréscimo (R$)</label>
                                <input type="number" step="0.01" min="0" value={form.acrescimo ?? ''} onChange={handleChange('acrescimo')} className={`${inputCls} py-2`} placeholder="0,00" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Desconto (R$)</label>
                                <input type="number" step="0.01" min="0" value={form.desconto ?? ''} onChange={handleChange('desconto')} className={`${inputCls} py-2 text-emerald-600`} placeholder="0,00" />
                            </div>
                        </div>

                        {/* Valor Total Calculado */}
                        <div className={`mt-5 p-4 rounded-xl border flex items-center justify-between
                            ${form.tipo === 'RECEBER' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <span className="text-sm font-bold text-slate-700">Valor Total Final:</span>
                            <span className={`text-xl font-black ${form.tipo === 'RECEBER' ? 'text-emerald-700' : 'text-red-700'}`}>
                                R$ {((parseFloat(form.valor) || 0) + (parseFloat(form.juros) || 0) + (parseFloat(form.multa) || 0) + (parseFloat(form.acrescimo) || 0) - (parseFloat(form.desconto) || 0)).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Vencimento */}
                    <div>
                        <label className={labelCls}>Data de Vencimento <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <CalendarDays size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="date"
                                value={form.data_vencimento}
                                onChange={handleChange('data_vencimento')}
                                className={`${inputCls} pl-10`}
                            />
                        </div>
                    </div>

                    {/* Categoria */}
                    <div>
                        <label className={labelCls}>Categoria <span className="text-red-500">*</span></label>
                        {loadingSelects ? (
                            <div className={`${inputCls} flex items-center gap-2 text-slate-400`}>
                                <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                                Carregando...
                            </div>
                        ) : (
                            <select value={form.categoria_id || ''} onChange={handleChange('categoria_id')} className={inputCls} required>
                                <option value="">— Selecione —</option>
                                {categorias?.map((c) => (
                                    <option key={c.id} value={c.id}>{c.descricao || c.nome}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Parceiro */}
                    <div>
                        <label className={labelCls}>{tipoFiltro} <span className="text-red-500">*</span></label>
                        {loadingSelects ? (
                            <div className={`${inputCls} flex items-center gap-2 text-slate-400`}>
                                <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                                Carregando...
                            </div>
                        ) : (
                            <select value={form.parceiro_id || ''} onChange={handleChange('parceiro_id')} className={inputCls} required>
                                <option value="">{parPlaceholder}</option>
                                {parceirosFiltrados.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
                        )}
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
                                    <input
                                        type="radio"
                                        name={`${idPrefix}_status`}
                                        value={s}
                                        checked={form.status === s}
                                        onChange={handleChange('status')}
                                        className="sr-only"
                                    />
                                    {s === 'Pendente' ? <Clock size={15} /> : <CheckCircle size={15} />}
                                    {s}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Campos extras se Status == Pago */}
                    {form.status === 'Pago' && (
                        <div className="md:col-span-2 p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl mt-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelCls}>Data do Pagamento <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <CalendarDays size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        value={form.data_pagamento || ''}
                                        onChange={handleChange('data_pagamento')}
                                        className={`${inputCls} pl-10`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Conta Corrente <span className="text-red-500">*</span></label>
                                {loadingSelects ? (
                                    <div className={`${inputCls} flex items-center gap-2 text-slate-400`}>
                                        <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
                                        Carregando...
                                    </div>
                                ) : (
                                    <select value={form.conta_corrente_id || ''} onChange={handleChange('conta_corrente_id')} className={inputCls} required>
                                        <option value="">— Selecione a conta —</option>
                                        {contasCorrentes?.map((cc) => (
                                            <option key={cc.id} value={cc.id}>{cc.descricao}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Modal de edição
// ─────────────────────────────────────────────────────────────
function ModalEdicao({ conta, categorias, parceiros, contasCorrentes, loadingSelects, onSalvo, onFechar }) {
    const { toast } = useToast();
    const overlayRef = useRef(null);

    const dataHoje = new Date().toISOString().slice(0, 10);

    const [form, setForm] = useState({
        tipo: conta.tipo ?? 'PAGAR',
        descricao: conta.descricao ?? '',
        valor: String(conta.valor ?? ''),
        juros: conta.juros != null ? String(conta.juros) : '',
        multa: conta.multa != null ? String(conta.multa) : '',
        desconto: conta.desconto != null ? String(conta.desconto) : '',
        acrescimo: conta.acrescimo != null ? String(conta.acrescimo) : '',
        data_vencimento: conta.data_vencimento ?? '',
        status: conta.status ?? 'Pendente',
        categoria_id: conta.categoria_id != null ? String(conta.categoria_id) : '',
        parceiro_id: conta.parceiro_id != null ? String(conta.parceiro_id) : '',
        conta_corrente_id: conta.conta_corrente_id != null ? String(conta.conta_corrente_id) : '',
        data_pagamento: conta.data_pagamento ?? dataHoje,
    });
    const [submitting, setSubmitting] = useState(false);

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
        if (!form.tipo) { toast.error('Selecione o tipo da conta.'); return; }
        if (!form.descricao.trim()) { toast.error('Informe a descrição.'); return; }
        if (!form.valor || parseFloat(form.valor) <= 0) { toast.error('Valor deve ser maior que zero.'); return; }
        if (!form.data_vencimento) { toast.error('Informe a data de vencimento.'); return; }
        if (!form.categoria_id) { toast.error('Selecione uma categoria.'); return; }
        if (!form.parceiro_id) {
            const msg = form.tipo === 'PAGAR' ? 'Selecione um fornecedor.' : 'Selecione um cliente.';
            toast.error(msg);
            return;
        }
        if (form.status === 'Pago' || form.status === 'Recebido' || form.status === 'PAGO') {
            if (!form.conta_corrente_id) { toast.error('Uma Conta Corrente é obrigatória para lançamentos pagos.'); return; }
            if (!form.data_pagamento) { toast.error('A Data de Pagamento é obrigatória.'); return; }
        }

        setSubmitting(true);
        try {
            await contasAPI.atualizar(conta.id, {
                tipo: form.tipo,
                descricao: form.descricao.trim(),
                valor: parseFloat(form.valor),
                juros: parseFloat(form.juros) || 0,
                multa: parseFloat(form.multa) || 0,
                desconto: parseFloat(form.desconto) || 0,
                acrescimo: parseFloat(form.acrescimo) || 0,
                data_vencimento: form.data_vencimento,
                status: form.status === 'Pago' ? 'PAGO' : 'Pendente',
                categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
                parceiro_id: form.parceiro_id ? Number(form.parceiro_id) : null,
                ...(form.status === 'Pago' ? {
                    conta_corrente_id: Number(form.conta_corrente_id),
                    data_pagamento: form.data_pagamento
                } : {})
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
                    <button onClick={onFechar}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden" noValidate>
                    <div className="flex-1 overflow-y-auto p-6">
                        <FormConta
                            idPrefix="modal"
                            form={form}
                            setForm={setForm}
                            categorias={categorias}
                            parceiros={parceiros}
                            contasCorrentes={contasCorrentes}
                            loadingSelects={loadingSelects}
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white rounded-b-2xl flex-shrink-0">
                        <button type="button" onClick={onFechar}
                            className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={submitting}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
                            {submitting
                                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                : <CheckCircle size={15} />}
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
//  Modal de Baixa — selecionar conta corrente
// ─────────────────────────────────────────────────────────────
function ModalBaixa({ conta, onSalvo, onFechar }) {
    const { toast } = useToast();
    const overlayRef = useRef(null);

    const dataHoje = new Date().toISOString().slice(0, 10);

    const [contasCorrentes, setContasCorrentes] = useState([]);
    const [loadingCC, setLoadingCC] = useState(true);
    const [selected, setSelected] = useState('');
    const [dataPagamento, setDataPagamento] = useState(dataHoje);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const esc = (e) => { if (e.key === 'Escape') onFechar(); };
        document.addEventListener('keydown', esc);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', esc);
        };
    }, [onFechar]);

    useEffect(() => {
        contasCorrentesAPI.listar()
            .then((data) => setContasCorrentes(Array.isArray(data) ? data : []))
            .catch(() => toast.error('Erro ao carregar contas correntes.'))
            .finally(() => setLoadingCC(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleConfirmar = async () => {
        if (!dataPagamento) { toast.error('Informe a data do pagamento.'); return; }
        if (!selected) { toast.error('Selecione uma conta corrente.'); return; }

        setSubmitting(true);
        try {
            await contasAPI.baixar(conta.id, Number(selected), dataPagamento);
            toast.success(`Baixa realizada com sucesso para "${conta.descricao}"!`);
            onSalvo();
        } catch (err) {
            toast.error(`Erro ao dar baixa: ${err.message}`);
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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                style={{ animation: 'baixaIn .22s cubic-bezier(.22,1,.36,1) both' }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-600" />
                        Dar Baixa
                    </h2>
                    <button onClick={onFechar} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <p className="text-sm text-slate-600 mb-1">
                    <span className="font-medium">Conta:</span> {conta.descricao}
                </p>
                <p className="text-sm text-slate-600 mb-4">
                    <span className="font-medium">Valor:</span>{' '}
                    <span className={conta.tipo === 'RECEBER' ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>
                        R$ {Number(conta.valor).toFixed(2)}
                    </span>
                </p>

                <div className="grid grid-cols-1 gap-4 mb-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Data do Pagamento *
                        </label>
                        <input
                            type="date"
                            value={dataPagamento}
                            onChange={(e) => setDataPagamento(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Conta Corrente *
                        </label>
                        {loadingCC ? (
                            <div className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm flex items-center gap-2 text-slate-400">
                                <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
                                Carregando...
                            </div>
                        ) : contasCorrentes.length === 0 ? (
                            <p className="text-sm text-red-500">Nenhuma conta corrente cadastrada. Cadastre uma primeiro.</p>
                        ) : (
                            <select
                                value={selected}
                                onChange={(e) => setSelected(e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white"
                            >
                                <option value="">— Selecione a conta corrente —</option>
                                {contasCorrentes.map((cc) => (
                                    <option key={cc.id} value={cc.id}>
                                        {cc.descricao} (Saldo: R$ {Number(cc.saldo ?? 0).toFixed(2)})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={onFechar}
                        className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmar}
                        disabled={submitting || !selected || loadingCC}
                        className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting
                            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <CheckCircle size={15} />}
                        {submitting ? 'Processando...' : 'Confirmar Baixa'}
                    </button>
                </div>
            </div>
            <style>{`@keyframes baixaIn{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:none}}`}</style>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Formulário de novo lançamento
// ─────────────────────────────────────────────────────────────
function FormularioNovoLancamento({ categorias, parceiros, contasCorrentes, loadingSelects, onSalvo, onCancelar }) {
    const { toast } = useToast();

    const dataHoje = new Date().toISOString().slice(0, 10);

    const [form, setForm] = useState({
        tipo: 'PAGAR', descricao: '', valor: '',
        juros: '', multa: '', desconto: '', acrescimo: '',
        data_vencimento: '', status: 'Pendente',
        categoria_id: '', parceiro_id: '',
        conta_corrente_id: '', data_pagamento: dataHoje,
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.tipo) { toast.error('Selecione o tipo da conta.'); return; }
        if (!form.descricao.trim()) { toast.error('Informe a descrição da conta.'); return; }
        if (!form.valor || parseFloat(form.valor) <= 0) { toast.error('O valor deve ser maior que zero.'); return; }
        if (!form.data_vencimento) { toast.error('Informe a data de vencimento.'); return; }
        if (!form.categoria_id) { toast.error('Selecione uma categoria.'); return; }
        if (!form.parceiro_id) {
            const msg = form.tipo === 'PAGAR' ? 'Selecione um fornecedor.' : 'Selecione um cliente.';
            toast.error(msg);
            return;
        }
        if (form.status === 'Pago' || form.status === 'Recebido' || form.status === 'PAGO') {
            if (!form.conta_corrente_id) { toast.error('Uma Conta Corrente é obrigatória para lançamentos pagos.'); return; }
            if (!form.data_pagamento) { toast.error('A Data de Pagamento é obrigatória.'); return; }
        }

        setSubmitting(true);
        try {
            await contasAPI.criar({
                tipo: form.tipo,
                descricao: form.descricao.trim(),
                valor: parseFloat(form.valor),
                juros: parseFloat(form.juros) || 0,
                multa: parseFloat(form.multa) || 0,
                desconto: parseFloat(form.desconto) || 0,
                acrescimo: parseFloat(form.acrescimo) || 0,
                data_vencimento: form.data_vencimento,
                status: form.status === 'Pago' ? 'PAGO' : 'Pendente',
                ...(form.categoria_id ? { categoria_id: Number(form.categoria_id) } : {}),
                ...(form.parceiro_id ? { parceiro_id: Number(form.parceiro_id) } : {}),
                ...(form.status === 'Pago' ? {
                    conta_corrente_id: Number(form.conta_corrente_id),
                    data_pagamento: form.data_pagamento
                } : {})
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
                <FormConta
                    idPrefix="novo"
                    form={form}
                    setForm={setForm}
                    categorias={categorias}
                    parceiros={parceiros}
                    contasCorrentes={contasCorrentes}
                    loadingSelects={loadingSelects}
                />
                <div className="flex items-center justify-end gap-3 mt-6">
                    <button type="button" onClick={onCancelar}
                        className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" disabled={submitting}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200">
                        {submitting
                            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <DollarSign size={15} />}
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
    const [contasCorrentes, setContasCorrentes] = useState([]);
    const [loadingSelects, setLoadingSelects] = useState(true);

    const catMap = Object.fromEntries(categorias.map((c) => [c.id, c]));
    const parMap = Object.fromEntries(parceiros.map((p) => [p.id, p]));

    const [contaEditando, setContaEditando] = useState(null);
    const [contaBaixa, setContaBaixa] = useState(null);
    const [confirm, setConfirm] = useState({ isOpen: false, conta: null });

    useEffect(() => {
        Promise.all([categoriasAPI.listar(), parceirosAPI.listar(), contasCorrentesAPI.listar()])
            .then(([cats, pars, ccs]) => {
                setCategorias(Array.isArray(cats) ? cats : []);
                setParceiros(Array.isArray(pars) ? pars : []);
                setContasCorrentes(Array.isArray(ccs) ? ccs : []);
            })
            .catch(() => toast.warning('Não foi possível carregar listas auxiliares.'))
            .finally(() => setLoadingSelects(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { carregar(); }, [carregar]);

    const handleDeletarSolicitado = useCallback((conta) => {
        setConfirm({ isOpen: true, conta });
    }, []);

    const handleDeletarConfirmado = async () => {
        const { conta } = confirm;
        setConfirm({ isOpen: false, conta: null });
        try {
            await contasAPI.deletar(conta.id);
            toast.success('Conta excluída com sucesso.');
            carregar();
        } catch (err) {
            toast.error(`Falha ao excluir: ${err.message}`);
        }
    };

    // ── VIEW: Formulário ─────────────────────────────────────
    if (view === 'form') {
        return (
            <div>
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lançamento de Contas</h1>
                    <p className="text-slate-500 mt-1 text-sm">Registre uma nova conta a pagar ou receber.</p>
                </header>
                <FormularioNovoLancamento
                    categorias={categorias}
                    parceiros={parceiros}
                    contasCorrentes={contasCorrentes}
                    loadingSelects={loadingSelects}
                    onSalvo={() => { setView('list'); carregar(); }}
                    onCancelar={() => setView('list')}
                />
            </div>
        );
    }

    // ── VIEW: Listagem ───────────────────────────────────────
    return (
        <div>
            <ConfirmModal
                isOpen={confirm.isOpen}
                title="Excluir lançamento"
                message={`Deseja realmente excluir a conta "${confirm.conta?.descricao}"? Esta ação não pode ser desfeita.`}
                danger
                onConfirm={handleDeletarConfirmado}
                onCancel={() => setConfirm({ isOpen: false, conta: null })}
            />

            {contaEditando && (
                <ModalEdicao
                    conta={contaEditando}
                    categorias={categorias}
                    parceiros={parceiros}
                    contasCorrentes={contasCorrentes}
                    loadingSelects={loadingSelects}
                    onSalvo={() => { setContaEditando(null); carregar(); }}
                    onFechar={() => setContaEditando(null)}
                />
            )}

            {contaBaixa && (
                <ModalBaixa
                    conta={contaBaixa}
                    onSalvo={() => { setContaBaixa(null); carregar(); }}
                    onFechar={() => setContaBaixa(null)}
                />
            )}

            <header className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lançamento de Contas</h1>
                    <p className="text-slate-500 mt-1 text-sm">Controle suas contas a pagar e a receber.</p>
                </div>
                <button onClick={() => setView('form')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-indigo-200">
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
                        onDeletar={handleDeletarSolicitado}
                        onBaixar={setContaBaixa}
                    />
                </>
            )}
        </div>
    );
}