// ============================================================
//  src/pages/DashboardPage.jsx
//  FEATURE 3 — Dashboard com gráficos reais (SVG puro)
//  a) ResumoCards
//  b) Gráfico de barras por mês (A Pagar / A Receber)
//  c) Gráfico de rosca por categoria (top 5 + Outros)
//  d) 5 contas com vencimento mais próximo (Pendentes)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, PieChart, CalendarClock, Wallet, CreditCard, ArrowRight } from 'lucide-react';
import { contasAPI, categoriasAPI, contasCorrentesAPI, cartoesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import ResumoCards from '../components/ResumoCards';

// ── Paleta de cores para o rosca ──────────────────────────────
const DONUT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#94a3b8'];

// ─────────────────────────────────────────────────────────────
//  Gráfico de Barras — contas por mês
// ─────────────────────────────────────────────────────────────
function GraficoBarras({ contas }) {
    // Agrupa por mês (YYYY-MM)
    const mapaM = {};
    for (const c of contas) {
        const mes = (c.data_vencimento ?? '').substring(0, 7);
        if (!mes) continue;
        if (!mapaM[mes]) mapaM[mes] = { pagar: 0, receber: 0 };
        if (c.tipo === 'PAGAR') mapaM[mes].pagar += Number(c.valor);
        if (c.tipo === 'RECEBER') mapaM[mes].receber += Number(c.valor);
    }

    const meses = Object.keys(mapaM).sort().slice(-6); // últimos 6 meses
    if (meses.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                Sem dados para exibir.
            </div>
        );
    }

    const maxVal = Math.max(...meses.flatMap((m) => [mapaM[m].pagar, mapaM[m].receber]), 1);
    const W = 540, H = 200, padL = 48, padB = 32, padT = 12;
    const chartW = W - padL - 16;
    const chartH = H - padB - padT;
    const barW = Math.min(24, (chartW / meses.length - 8) / 2);
    const slotW = chartW / meses.length;

    const yVal = (v) => padT + chartH - (v / maxVal) * chartH;

    // Ticks do eixo Y (4 linhas)
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
        y: padT + chartH * (1 - f),
        val: (maxVal * f).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
    }));

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
            {/* Grid lines */}
            {ticks.map((t) => (
                <g key={t.y}>
                    <line x1={padL} y1={t.y} x2={W - 8} y2={t.y} stroke="#e2e8f0" strokeWidth="1" />
                    <text x={padL - 6} y={t.y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{t.val}</text>
                </g>
            ))}

            {/* Barras */}
            {meses.map((mes, i) => {
                const cx = padL + slotW * i + slotW / 2;
                const hP = (mapaM[mes].pagar / maxVal) * chartH;
                const hR = (mapaM[mes].receber / maxVal) * chartH;
                const label = mes.substring(5); // MM

                return (
                    <g key={mes}>
                        {/* A Pagar — vermelho */}
                        <rect
                            x={cx - barW - 2} y={yVal(mapaM[mes].pagar)}
                            width={barW} height={hP}
                            rx="3" fill="#ef4444" opacity="0.85"
                        />
                        {/* A Receber — verde */}
                        <rect
                            x={cx + 2} y={yVal(mapaM[mes].receber)}
                            width={barW} height={hR}
                            rx="3" fill="#22c55e" opacity="0.85"
                        />
                        {/* Label mês */}
                        <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fill="#64748b">{label}</text>
                    </g>
                );
            })}

            {/* Legenda */}
            <rect x={padL} y={H - padB + 2} width="8" height="8" rx="2" fill="#ef4444" opacity="0.85" />
            <text x={padL + 11} y={H - padB + 9} fontSize="9" fill="#64748b">A Pagar</text>
            <rect x={padL + 62} y={H - padB + 2} width="8" height="8" rx="2" fill="#22c55e" opacity="0.85" />
            <text x={padL + 75} y={H - padB + 9} fontSize="9" fill="#64748b">A Receber</text>
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────
//  Gráfico de Rosca — distribuição por categoria
// ─────────────────────────────────────────────────────────────
function GraficoRosca({ contas, catMap }) {
    // Agrupa por categoria_id, soma valor absoluto
    const mapaC = {};
    for (const c of contas) {
        const key = c.categoria_id ?? '__sem__';
        mapaC[key] = (mapaC[key] ?? 0) + Math.abs(Number(c.valor));
    }

    // Ordena e pega top 5
    const entries = Object.entries(mapaC).sort((a, b) => b[1] - a[1]);
    const top5 = entries.slice(0, 5);
    const outros = entries.slice(5).reduce((s, [, v]) => s + v, 0);
    if (outros > 0) top5.push(['__outros__', outros]);
    const total = top5.reduce((s, [, v]) => s + v, 0);

    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                Sem dados para exibir.
            </div>
        );
    }

    // Calcula arcos SVG
    const cx = 90, cy = 90, R = 70, r = 42;
    let angle = -Math.PI / 2;
    const arcs = top5.map(([key, val], i) => {
        const frac = val / total;
        const sweep = frac * 2 * Math.PI;
        const x1 = cx + R * Math.cos(angle);
        const y1 = cy + R * Math.sin(angle);
        const x2 = cx + R * Math.cos(angle + sweep);
        const y2 = cy + R * Math.sin(angle + sweep);
        const ix1 = cx + r * Math.cos(angle);
        const iy1 = cy + r * Math.sin(angle);
        const ix2 = cx + r * Math.cos(angle + sweep);
        const iy2 = cy + r * Math.sin(angle + sweep);
        const large = sweep > Math.PI ? 1 : 0;
        const color = DONUT_COLORS[i % DONUT_COLORS.length];
        const label = key === '__sem__' ? 'Sem categoria'
            : key === '__outros__' ? 'Outros'
                : (catMap[key]?.descricao ?? `#${key}`);
        const d = [
            `M ${x1} ${y1}`,
            `A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`,
            `L ${ix2} ${iy2}`,
            `A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1}`,
            'Z',
        ].join(' ');
        const midAngle = angle + sweep / 2;
        angle += sweep;
        return { d, color, label, pct: (frac * 100).toFixed(1), val, midAngle };
    });

    return (
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <svg viewBox="0 0 180 180" className="w-44 h-44 flex-shrink-0">
                {arcs.map((a, i) => (
                    <path key={i} d={a.d} fill={a.color} opacity="0.88" stroke="#fff" strokeWidth="2" />
                ))}
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#64748b">Total</text>
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">
                    {total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </text>
            </svg>

            <div className="flex flex-col gap-2 flex-1 w-full">
                {arcs.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: a.color }} />
                        <span className="text-slate-700 flex-1 truncate">{a.label}</span>
                        <span className="text-slate-400 text-xs">{a.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Lista — 5 contas com vencimento mais próximo (Pendentes)
// ─────────────────────────────────────────────────────────────
function ProximosVencimentos({ contas, catMap }) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const proximas = contas
        .filter((c) => c.status === 'Pendente')
        .map((c) => ({ ...c, _dt: new Date(c.data_vencimento + 'T00:00:00') }))
        .sort((a, b) => a._dt - b._dt)
        .slice(0, 5);

    if (proximas.length === 0) {
        return (
            <p className="text-slate-400 text-sm py-4 text-center">
                Nenhuma conta pendente.
            </p>
        );
    }

    return (
        <ul className="divide-y divide-slate-100">
            {proximas.map((c) => {
                const diff = Math.round((c._dt - hoje) / 86400000);
                const vence = diff < 0 ? 'Atrasada' : diff === 0 ? 'Hoje' : `${diff}d`;
                const badge = diff < 0
                    ? 'bg-red-100 text-red-700'
                    : diff === 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600';
                const catNome = c.categoria_id ? (catMap[c.categoria_id]?.descricao ?? '') : '';
                return (
                    <li key={c.id} className="flex items-center justify-between py-3 gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">{c.descricao}</p>
                            {catNome && <p className="text-xs text-slate-400 truncate">{catNome}</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.tipo === 'RECEBER' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {c.tipo === 'RECEBER' ? '+' : '-'} R$ {Number(c.valor).toFixed(2)}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{vence}</span>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

// ─────────────────────────────────────────────────────────────
//  Página principal
// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { toast } = useToast();
    const [contas, setContas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [contasCorrentes, setContasCorrentes] = useState([]);
    const [cartoes, setCartoes] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const catMap = Object.fromEntries(categorias.map((c) => [c.id, c]));

    const carregar = useCallback(async () => {
        try {
            const [c, cats, ccs, cards] = await Promise.all([
                contasAPI.listar(0, 500),
                categoriasAPI.listar(),
                contasCorrentesAPI.listar(),
                cartoesAPI.listar(),
            ]);
            setContas(Array.isArray(c) ? c : []);
            setCategorias(Array.isArray(cats) ? cats : []);
            setContasCorrentes(Array.isArray(ccs) ? ccs : []);
            setCartoes(Array.isArray(cards) ? cards : []);
        } catch (err) {
            toast.error(`Erro ao carregar dashboard: ${err.message}`);
        } finally {
            setCarregando(false);
        }
    }, [toast]);

    useEffect(() => { carregar(); }, [carregar]);

    if (carregando) {
        return (
            <div className="flex items-center justify-center py-24">
                <span className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                <span className="ml-3 text-slate-500 text-sm">Carregando dashboard...</span>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
                <p className="text-slate-500 mt-1 text-sm">Visão geral das suas finanças.</p>
            </header>

            {/* a) Cards de resumo */}
            <ResumoCards contas={contas} contasCorrentes={contasCorrentes} cartoes={cartoes} />

            {/* NOVA SEÇÃO: Minhas Carteiras e Cartões */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                
                {/* Contas Correntes */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-2">
                            <Wallet size={18} className="text-indigo-500" />
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Minhas Carteiras</h2>
                        </div>
                    </div>
                    <div className="p-5 flex-1 max-h-[280px] overflow-y-auto bg-slate-50/50">
                        {contasCorrentes.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm mt-8">Nenhuma conta corrente cadastrada.</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {contasCorrentes.map((cc) => (
                                    <div key={cc.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                <Wallet size={16} className="text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{cc.descricao}</p>
                                                <p className="text-xs text-slate-400">CC #{cc.id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-black tracking-tight ${Number(cc.saldo) >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                                                R$ {Number(cc.saldo ?? 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cartões de Crédito */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-2">
                            <CreditCard size={18} className="text-violet-500" />
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Meus Cartões</h2>
                        </div>
                    </div>
                    <div className="p-5 flex-1 max-h-[280px] overflow-y-auto bg-slate-50/50">
                        {cartoes.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm mt-8">Nenhum cartão de crédito cadastrado.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {cartoes.map((card) => (
                                    <div key={card.id} className="bg-gradient-to-br from-slate-800 to-violet-950 p-4 rounded-xl shadow-md border border-slate-700 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-white opacity-5 rounded-full blur-xl" />
                                        <div className="flex justify-between items-start mb-4">
                                            <CreditCard size={20} className="text-violet-300" />
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Venc. Dia {card.dia_vencimento}</p>
                                        </div>
                                        <h3 className="text-sm font-bold text-white tracking-wide mb-1 truncate">{card.nome}</h3>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] uppercase text-violet-300 font-semibold mb-0.5">Limite Total</p>
                                                <p className="text-sm font-black text-white">R$ {Number(card.limite).toFixed(2)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase text-violet-300 font-semibold mb-0.5">Disponível</p>
                                                <p className="text-sm font-black text-emerald-400">R$ {Number(card.limite_livre ?? 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* b + c) Gráficos lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Gráfico de barras */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col items-center">
                    <div className="w-full flex items-center gap-2 mb-4">
                        <BarChart2 size={18} className="text-indigo-500" />
                        <h2 className="text-sm font-bold text-slate-700">Contas por Mês</h2>
                    </div>
                    <GraficoBarras contas={contas} />
                </div>

                {/* Gráfico de rosca */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center">
                    <div className="w-full flex items-center gap-2 mb-4">
                        <PieChart size={18} className="text-violet-500" />
                        <h2 className="text-sm font-bold text-slate-700">Distribuição por Categoria</h2>
                    </div>
                    <GraficoRosca contas={contas} catMap={catMap} />
                </div>
            </div>

            {/* d) Próximos vencimentos */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <CalendarClock size={18} className="text-amber-500" />
                        <h2 className="text-sm font-bold text-slate-700">Próximos Vencimentos (Pendentes)</h2>
                    </div>
                </div>
                <ProximosVencimentos contas={contas} catMap={catMap} />
            </div>
        </div>
    );
}