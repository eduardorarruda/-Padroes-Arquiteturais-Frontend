// ============================================================
//  src/pages/CategoriasPage.jsx
//  Cadastro de Categorias de despesas
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, Tag, Search, FolderOpen } from 'lucide-react';
import { categoriasAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

// Paleta de cores para chips de categoria (cicla automaticamente)
const PALETTE = [
    { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
    { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
    { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
];

function getColor(index) {
    return PALETTE[index % PALETTE.length];
}

// ── Chip de categoria ──────────────────────────────────────────
function CategoriaChip({ descricao, index }) {
    const c = getColor(index);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {descricao}
        </span>
    );
}

// ── Formulário de cadastro ─────────────────────────────────────
function FormularioCategoria({ onAdicionada }) {
    const { toast } = useToast();
    const [descricao, setDescricao] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!descricao.trim()) return;
        setLoading(true);
        try {
            await categoriasAPI.criar(descricao.trim());
            toast.success(`Categoria "${descricao.trim()}" criada com sucesso!`);
            onAdicionada();
            setDescricao('');
        } catch (err) {
            toast.error(`Falha ao criar categoria: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <PlusCircle className="text-emerald-600" size={18} />
                Nova Categoria
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Descrição da categoria
                    </label>
                    <input
                        type="text"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        placeholder="Ex: Alimentação, Transporte, Aluguel..."
                        maxLength={60}
                        required
                    />
                    {descricao.length > 40 && (
                        <p className="text-xs text-slate-400 mt-1 text-right">
                            {descricao.length}/60
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !descricao.trim()}
                    className="sm:mb-0 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                    {loading
                        ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                        : <PlusCircle size={15} />}
                    Criar Categoria
                </button>
            </form>
        </div>
    );
}

// ── Grid de categorias (visual mode) ──────────────────────────
function GridCategorias({ categorias, onDeletar }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {categorias.map((cat, index) => {
                const c = getColor(index);
                return (
                    <div
                        key={cat.id}
                        className="group bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                                <Tag size={16} className={c.text} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                    {cat.descricao}
                                </p>
                                <p className="text-xs text-slate-400">#{cat.id}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onDeletar(cat.id, cat.descricao)}
                            title="Excluir categoria"
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

// ── Tabela de categorias (list mode) ──────────────────────────
function TabelaCategorias({ categorias, onDeletar }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Categorias cadastradas</h2>
                <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                    {categorias.length} {categorias.length === 1 ? 'categoria' : 'categorias'}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                            <th className="px-6 py-3 font-semibold uppercase tracking-wider">Categoria</th>
                            <th className="px-6 py-3 font-semibold uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 font-semibold uppercase tracking-wider text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {categorias.map((cat, index) => (
                            <tr key={cat.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-3.5">
                                    <CategoriaChip descricao={cat.descricao} index={index} />
                                </td>
                                <td className="px-6 py-3.5">
                                    <span className="text-xs text-slate-400 font-mono">#{cat.id}</span>
                                </td>
                                <td className="px-6 py-3.5 text-right">
                                    <button
                                        onClick={() => onDeletar(cat.id, cat.descricao)}
                                        title="Excluir categoria"
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={15} />
                                    </button>
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
export default function CategoriasPage() {
    const { toast } = useToast();
    const [categorias, setCategorias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [busca, setBusca] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    const carregar = useCallback(async () => {
        try {
            const data = await categoriasAPI.listar();
            setCategorias(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(`Erro ao carregar categorias: ${err.message}`);
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const handleDeletar = async (id, descricao) => {
        if (!window.confirm(`Deseja realmente excluir a categoria "${descricao}"?`)) return;
        try {
            await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
            toast.success(`Categoria "${descricao}" removida.`);
            carregar();
        } catch (err) {
            toast.error(`Falha ao excluir: ${err.message}`);
        }
    };

    const filtradas = categorias.filter((c) =>
        c.descricao.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div>
            {/* Cabeçalho */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                    Cadastro de Categorias
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                    Organize suas despesas e receitas por categorias personalizadas.
                </p>
            </header>

            {/* Card de resumo */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6 flex items-center gap-4 w-fit">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <FolderOpen size={22} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-medium">Total de Categorias</p>
                    <p className="text-2xl font-bold text-slate-800">
                        {carregando ? '—' : categorias.length}
                    </p>
                </div>
            </div>

            {/* Formulário */}
            <FormularioCategoria onAdicionada={carregar} />

            {/* Barra de ferramentas */}
            {categorias.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar categoria..."
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        />
                    </div>

                    {/* Toggle de visualização */}
                    <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5
                ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                            </svg>
                            Grade
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5
                ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                            Lista
                        </button>
                    </div>
                </div>
            )}

            {/* Conteúdo */}
            {carregando ? (
                <div className="flex items-center justify-center py-16">
                    <span className="w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                    <span className="ml-3 text-slate-500 text-sm">Carregando categorias...</span>
                </div>
            ) : categorias.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Tag size={24} className="text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Nenhuma categoria cadastrada.</p>
                    <p className="text-slate-400 text-sm mt-1">Use o formulário acima para criar a primeira categoria.</p>
                </div>
            ) : filtradas.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                    <p className="text-slate-500">Nenhuma categoria encontrada para "{busca}".</p>
                </div>
            ) : viewMode === 'grid' ? (
                <GridCategorias categorias={filtradas} onDeletar={handleDeletar} />
            ) : (
                <TabelaCategorias categorias={filtradas} onDeletar={handleDeletar} />
            )}
        </div>
    );
}