// ============================================================
//  src/pages/CartoesPage.jsx
//  Mestre-Detalhe de Cartões de Crédito:
//  - Master: lista de cartões, cadastro de novo cartão
//  - Detail: lançamentos (compras) e fechamento de fatura
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    PlusCircle, CreditCard, X, Check, ArrowLeft,
    CalendarDays, DollarSign, Tag, FileText, ChevronRight, Pencil
} from 'lucide-react';
import { cartoesAPI, contasCorrentesAPI, categoriasAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const inputCls =
    'w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm ' +
    'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white';

// ─────────────────────────────────────────────────────────────
//  Helpers de Data
// ─────────────────────────────────────────────────────────────
const meses = [
    { label: 'Janeiro', value: '1' }, { label: 'Fevereiro', value: '2' },
    { label: 'Março', value: '3' }, { label: 'Abril', value: '4' },
    { label: 'Maio', value: '5' }, { label: 'Junho', value: '6' },
    { label: 'Julho', value: '7' }, { label: 'Agosto', value: '8' },
    { label: 'Setembro', value: '9' }, { label: 'Outubro', value: '10' },
    { label: 'Novembro', value: '11' }, { label: 'Dezembro', value: '12' },
];

const currentMonth = String(new Date().getMonth() + 1);
const currentYear = String(new Date().getFullYear());

const anos = Array.from({ length: 5 }, (_, i) => String(Number(currentYear) - 2 + i));

// ─────────────────────────────────────────────────────────────
//  Modal de Criar / Editar Cartão
// ─────────────────────────────────────────────────────────────
function ModalCartao({ cartao, onSalvo, onFechar }) {
    const { toast } = useToast();
    const isEdit = !!cartao;
    const overlayRef = useRef(null);

    const [loadingCC, setLoadingCC] = useState(true);
    const [contasCorrentes, setContasCorrentes] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        nome: cartao?.nome ?? '',
        limite: cartao?.limite ? String(cartao.limite) : '',
        dia_fechamento: cartao?.dia_fechamento ? String(cartao.dia_fechamento) : '',
        dia_vencimento: cartao?.dia_vencimento ? String(cartao.dia_vencimento) : '',
        conta_corrente_id: cartao?.conta_corrente_id ? String(cartao.conta_corrente_id) : '',
    });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nome.trim()) { toast.error('Informe o nome do cartão.'); return; }
        if (!form.limite || Number(form.limite) <= 0) { toast.error('Informe um limite válido.'); return; }
        if (!form.dia_fechamento || form.dia_fechamento < 1 || form.dia_fechamento > 31) { toast.error('Dia de fechamento inválido.'); return; }
        if (!form.dia_vencimento || form.dia_vencimento < 1 || form.dia_vencimento > 31) { toast.error('Dia de vencimento inválido.'); return; }
        if (!form.conta_corrente_id) { toast.error('Selecione uma conta corrente para pagamento da fatura.'); return; }

        setSubmitting(true);
        try {
            const dados = {
                nome: form.nome.trim(),
                limite: parseFloat(form.limite),
                dia_fechamento: parseInt(form.dia_fechamento, 10),
                dia_vencimento: parseInt(form.dia_vencimento, 10),
                conta_corrente_id: Number(form.conta_corrente_id),
            };
            if (isEdit) {
                await cartoesAPI.atualizar(cartao.id, dados);
                toast.success('Cartão de crédito atualizado!');
            } else {
                await cartoesAPI.criar(dados);
                toast.success('Cartão de crédito criado com sucesso!');
            }
            onSalvo();
        } catch (err) {
            toast.error(`Erro: ${err.message}`);
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
                style={{ animation: 'cardModalIn .22s cubic-bezier(.22,1,.36,1) both' }}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        {isEdit ? <Pencil size={16} className="text-indigo-600" /> : <PlusCircle size={16} className="text-indigo-600" />}
                        {isEdit ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
                    </h2>
                    <button onClick={onFechar} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cartão *</label>
                        <input
                            type="text"
                            value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            className={inputCls}
                            placeholder="Ex: Nubank, Itaú..."
                            maxLength={50}
                            autoFocus
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Limite (R$) *</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={form.limite}
                                onChange={(e) => setForm({ ...form, limite: e.target.value })}
                                className={`${inputCls} pl-10`}
                                placeholder="0,00"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Dia de Fechamento *</label>
                            <input
                                type="number" min="1" max="31"
                                value={form.dia_fechamento}
                                onChange={(e) => setForm({ ...form, dia_fechamento: e.target.value })}
                                className={inputCls}
                                placeholder="Ex: 5"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Dia de Vencimento *</label>
                            <input
                                type="number" min="1" max="31"
                                value={form.dia_vencimento}
                                onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
                                className={inputCls}
                                placeholder="Ex: 10"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Conta Corrente Vinculada *</label>
                        {loadingCC ? (
                            <div className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm flex items-center gap-2 text-slate-400">
                                <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                                Carregando...
                            </div>
                        ) : contasCorrentes.length === 0 ? (
                            <p className="text-sm text-red-500">Nenhuma conta corrente cadastrada.</p>
                        ) : (
                            <select
                                value={form.conta_corrente_id}
                                onChange={(e) => setForm({ ...form, conta_corrente_id: e.target.value })}
                                className={inputCls}
                                required
                            >
                                <option value="">— Selecione —</option>
                                {contasCorrentes.map((cc) => (
                                    <option key={cc.id} value={cc.id}>{cc.descricao}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onFechar}
                            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={submitting || loadingCC}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                            {submitting
                                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                : <Check size={15} />}
                            {submitting ? 'Salvando...' : 'Salvar Cartão'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`@keyframes cardModalIn{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:none}}`}</style>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Detalhes do Cartão (Lançamentos e Fatura)
// ─────────────────────────────────────────────────────────────
function CartaoDetail({ cartao, onBack, onEditar }) {
    const { toast } = useToast();
    const [tab, setTab] = useState('lancamentos'); // lancamentos | fatura

    const [mesSelecionado, setMesSelecionado] = useState(currentMonth);
    const [anoSelecionado, setAnoSelecionado] = useState(currentYear);

    const [lancamentos, setLancamentos] = useState([]);
    const [loadingLancamentos, setLoadingLancamentos] = useState(false);

    const [categorias, setCategorias] = useState([]);
    const [catMap, setCatMap] = useState({});
    const [loadingCat, setLoadingCat] = useState(true);

    const [formLancamento, setFormLancamento] = useState({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        categoria_id: '',
    });
    const [addLoading, setAddLoading] = useState(false);
    const [fecharLoading, setFecharLoading] = useState(false);

    useEffect(() => {
        categoriasAPI.listar()
            .then((cats) => {
                if (Array.isArray(cats)) {
                    setCategorias(cats);
                    setCatMap(Object.fromEntries(cats.map((c) => [c.id, c])));
                }
            })
            .catch(() => toast.error('Erro ao carregar categorias.'))
            .finally(() => setLoadingCat(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const carregarLancamentos = useCallback(async () => {
        setLoadingLancamentos(true);
        try {
            const data = await cartoesAPI.listarLancamentos(cartao.id, Number(mesSelecionado), Number(anoSelecionado));
            setLancamentos(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(`Erro ao carregar lançamentos: ${err.message}`);
        } finally {
            setLoadingLancamentos(false);
        }
    }, [cartao.id, mesSelecionado, anoSelecionado, toast]);

    useEffect(() => {
        carregarLancamentos();
    }, [carregarLancamentos]);

    const handleAddLancamento = async (e) => {
        e.preventDefault();
        if (!formLancamento.descricao.trim()) { toast.error('Informe a descrição do lançamento.'); return; }
        if (!formLancamento.valor || Number(formLancamento.valor) <= 0) { toast.error('Valor deve ser maior que zero.'); return; }
        if (!formLancamento.data) { toast.error('Informe a data da compra.'); return; }
        if (!formLancamento.categoria_id) { toast.error('Selecione uma categoria.'); return; }

        setAddLoading(true);
        try {
            await cartoesAPI.criarLancamento(cartao.id, {
                descricao: formLancamento.descricao.trim(),
                valor: parseFloat(formLancamento.valor),
                data: formLancamento.data,
                ...(formLancamento.categoria_id ? { categoria_id: Number(formLancamento.categoria_id) } : {}),
            });
            toast.success('Compra adicionada com sucesso!');
            setFormLancamento((f) => ({ ...f, descricao: '', valor: '' }));
            carregarLancamentos();
        } catch (err) {
            toast.error(`Erro: ${err.message}`);
        } finally {
            setAddLoading(false);
        }
    };

    const handleFecharFatura = async () => {
        setFecharLoading(true);
        try {
            await cartoesAPI.fecharFatura(cartao.id, Number(mesSelecionado), Number(anoSelecionado));
            toast.success('Fatura fechada! Uma nova Conta a Pagar foi gerada.');
        } catch (err) {
            toast.error(`Erro ao fechar fatura: ${err.message}`);
        } finally {
            setFecharLoading(false);
        }
    };

    const totalLancamentos = lancamentos.reduce((acc, l) => acc + Number(l.valor), 0);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Voltar"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <CreditCard className="text-indigo-600" size={20} />
                            {cartao.nome}
                        </h2>
                        <p className="text-sm text-slate-500">
                            Limite: R$ {Number(cartao.limite).toFixed(2)} (Livre: R$ {Number(cartao.limite_livre ?? 0).toFixed(2)}) •
                            Venc: dia {cartao.dia_vencimento} • Fech: dia {cartao.dia_fechamento}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onEditar}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors"
                >
                    <Pencil size={15} />
                    Editar Cartão
                </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setTab('lancamentos')}
                    className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${tab === 'lancamentos' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Lançamentos
                </button>
                <button
                    onClick={() => setTab('fatura')}
                    className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${tab === 'fatura' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Fatura
                </button>
            </div>

            <div className="flex gap-4 items-center">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Mês</label>
                    <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} className="px-3 border border-slate-300 rounded-lg text-sm h-10 w-36 outline-none">
                        {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Ano</label>
                    <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)} className="px-3 border border-slate-300 rounded-lg text-sm h-10 w-24 outline-none">
                        {anos.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            {tab === 'lancamentos' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulário Novo Lançamento */}
                    <div className="lg:col-span-1 border border-slate-200 bg-white rounded-xl shadow-sm p-5 h-fit">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Adicionar Compra</h3>
                        <form onSubmit={handleAddLancamento} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição *</label>
                                <input
                                    type="text"
                                    value={formLancamento.descricao}
                                    onChange={(e) => setFormLancamento({ ...formLancamento, descricao: e.target.value })}
                                    className={inputCls}
                                    placeholder="Ex: Supermercado"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Valor (R$) *</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">R$</span>
                                    <input
                                        type="number" step="0.01" min="0.01"
                                        value={formLancamento.valor}
                                        onChange={(e) => setFormLancamento({ ...formLancamento, valor: e.target.value })}
                                        className={`${inputCls} pl-10`}
                                        placeholder="0,00"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Data *</label>
                                <input
                                    type="date"
                                    value={formLancamento.data}
                                    onChange={(e) => setFormLancamento({ ...formLancamento, data: e.target.value })}
                                    className={inputCls}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria *</label>
                                {loadingCat ? (
                                    <div className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-400">Carregando...</div>
                                ) : (
                                    <select
                                        value={formLancamento.categoria_id}
                                        onChange={(e) => setFormLancamento({ ...formLancamento, categoria_id: e.target.value })}
                                        className={inputCls}
                                        required
                                    >
                                        <option value="">— Selecione —</option>
                                        {categorias.map((c) => (
                                            <option key={c.id} value={c.id}>{c.descricao || c.nome}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <button
                                type="submit" disabled={addLoading}
                                className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {addLoading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <PlusCircle size={15} />}
                                Adicionar Compra
                            </button>
                        </form>
                    </div>

                    {/* Lista Lançamentos */}
                    <div className="lg:col-span-2 border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-sm font-bold text-slate-700">Fatura {meses.find(m => m.value === mesSelecionado).label}/{anoSelecionado}</h3>
                            <span className="text-sm font-semibold text-slate-700 border border-slate-300 px-3 py-1 rounded-full bg-white">
                                Total: R$ {totalLancamentos.toFixed(2)}
                            </span>
                        </div>
                        <div className="overflow-y-auto max-h-[500px]">
                            {loadingLancamentos ? (
                                <div className="p-8 text-center text-slate-500">Carregando...</div>
                            ) : lancamentos.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">Nenhum lançamento encontrado neste mês.</div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white shadow-sm">
                                        <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                                            <th className="px-5 py-3 font-semibold uppercase">Data</th>
                                            <th className="px-5 py-3 font-semibold uppercase">Descrição</th>
                                            <th className="px-5 py-3 font-semibold uppercase hidden sm:table-cell">Categoria</th>
                                            <th className="px-5 py-3 font-semibold uppercase text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {lancamentos.map((l) => (
                                            <tr key={l.id} className="hover:bg-slate-50">
                                                <td className="px-5 py-3 text-sm text-slate-600">
                                                    {new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-5 py-3 text-sm font-medium text-slate-800">{l.descricao}</td>
                                                <td className="px-5 py-3 text-sm hidden sm:table-cell">
                                                    {l.categoria_id && catMap[l.categoria_id]
                                                        ? <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full"><Tag size={10} /> {catMap[l.categoria_id].descricao}</span>
                                                        : <span className="text-slate-300">—</span>}
                                                </td>
                                                <td className="px-5 py-3 text-sm font-semibold text-slate-800 text-right">R$ {Number(l.valor).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Fatura Tab */
                <div className="border border-slate-200 bg-white rounded-xl shadow-sm p-8 max-w-xl text-center mx-auto mt-4">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={28} className="text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Fechamento de Fatura</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Ao fechar a fatura de <strong>{meses.find(m => m.value === mesSelecionado).label}/{anoSelecionado}</strong>,
                        o sistema somará todos os lançamentos desse período (Total: R$ {totalLancamentos.toFixed(2)}) e gerará automaticamente uma
                        <strong> Conta a Pagar</strong> no Contas.
                    </p>
                    <button
                        onClick={handleFecharFatura}
                        disabled={fecharLoading || totalLancamentos === 0}
                        className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                    >
                        {fecharLoading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <DollarSign size={18} />}
                        Fechar Fatura e Gerar Pagamento
                    </button>
                    {totalLancamentos === 0 && (
                        <p className="text-xs text-red-500 mt-3 font-semibold">Não há lançamentos para fechar a fatura neste mês.</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Página Principal (Master)
// ─────────────────────────────────────────────────────────────
export default function CartoesPage() {
    const { toast } = useToast();

    const [cartoes, setCartoes] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const [modalAberta, setModalAberta] = useState(false);
    const [editandoCartao, setEditandoCartao] = useState(null);
    const [cartaoSelecionado, setCartaoSelecionado] = useState(null);

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const data = await cartoesAPI.listar();
            if (Array.isArray(data)) {
                setCartoes(data);
                // Atualiza o cartão selecionado se ele estiver na detail view
                if (cartaoSelecionado) {
                    const atualizado = data.find((c) => c.id === cartaoSelecionado.id);
                    if (atualizado) setCartaoSelecionado(atualizado);
                }
            }
        } catch (err) {
            toast.error(`Erro ao carregar cartões: ${err.message}`);
        } finally {
            setCarregando(false);
        }
    }, [toast, cartaoSelecionado]);

    useEffect(() => {
        if (!cartaoSelecionado) carregar();
    }, [carregar, cartaoSelecionado]);

    if (cartaoSelecionado && !modalAberta) {
        return (
            <CartaoDetail
                cartao={cartaoSelecionado}
                onBack={() => setCartaoSelecionado(null)}
                onEditar={() => {
                    setEditandoCartao(cartaoSelecionado);
                    setModalAberta(true);
                }}
            />
        );
    }

    return (
        <div>
            {modalAberta && (
                <ModalCartao
                    cartao={editandoCartao}
                    onSalvo={() => { setModalAberta(false); setEditandoCartao(null); carregar(); }}
                    onFechar={() => { setModalAberta(false); setEditandoCartao(null); }}
                />
            )}

            <header className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cartões de Crédito</h1>
                    <p className="text-slate-500 mt-1 text-sm">Gerencie faturas e lançamentos de crédito.</p>
                </div>
                <button onClick={() => { setEditandoCartao(null); setModalAberta(true); }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-indigo-200">
                    <PlusCircle size={16} />
                    <span className="hidden sm:inline">Novo Cartão</span>
                    <span className="sm:hidden">Novo</span>
                </button>
            </header>

            {carregando ? (
                <div className="flex items-center justify-center py-16">
                    <span className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="ml-3 text-slate-500 text-sm">Carregando cartões...</span>
                </div>
            ) : cartoes.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CreditCard size={24} className="text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Nenhum cartão de crédito castrado.</p>
                    <p className="text-slate-400 text-sm mt-1">Clique em "Novo Cartão" para adicionar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cartoes.map((cartao) => (
                        <div key={cartao.id} onClick={() => setCartaoSelecionado(cartao)}
                            className="bg-gradient-to-br from-slate-800 to-indigo-950 rounded-2xl p-6 shadow-lg border border-slate-700 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                            {/* Reflexo decorativo */}
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl transform group-hover:scale-150 transition-transform duration-500" />
                            
                            <div className="flex justify-between items-start mb-6">
                                <CreditCard size={28} className="text-indigo-300" />
                                <div className="flex items-center gap-2 relative z-10">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setEditandoCartao(cartao); setModalAberta(true); }}
                                        className="p-1.5 text-indigo-300/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Editar Cartão"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <ChevronRight size={20} className="text-slate-500 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-wide mb-1">{cartao.nome}</h3>
                            <p className="text-xs text-indigo-200/80 mb-6 font-mono">**** **** **** {String(cartao.id).padStart(4, '0')}</p>
                            
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Usado</p>
                                    <p className="text-sm font-bold text-red-400">R$ {Number(cartao.limite_usado ?? 0).toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Disponível</p>
                                    <p className="text-sm font-bold text-emerald-400">R$ {Number(cartao.limite_livre ?? 0).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Limite Total</p>
                                    <p className="text-sm font-bold text-white">R$ {Number(cartao.limite).toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Vencimento</p>
                                    <p className="text-sm font-bold text-white">Dia {cartao.dia_vencimento}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
