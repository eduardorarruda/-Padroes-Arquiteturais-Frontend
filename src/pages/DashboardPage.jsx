// ============================================================
//  src/pages/DashboardPage.jsx  — Versão aprimorada
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
    BarChart2, PieChart, CalendarClock, Wallet, CreditCard,
    TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
    Clock, ArrowUpRight, ArrowDownRight, Zap, Target,
    Activity, DollarSign,
} from 'lucide-react';
import { contasAPI, categoriasAPI, contasCorrentesAPI, cartoesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import ResumoCards from '../components/ResumoCards';

// ── Paleta de cores ───────────────────────────────────────────
const DONUT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#94a3b8'];

// ─────────────────────────────────────────────────────────────
//  Gauge de uso do cartão (SVG)
// ─────────────────────────────────────────────────────────────
function GaugeCartao({ usado, limite, nome, cor = '#6366f1' }) {
    const pct = limite > 0 ? Math.min(usado / limite, 1) : 0;
    const r = 36;
    const circ = 2 * Math.PI * r;
    // Arco de 220° (de -200° a 20°)
    const arcLen = circ * (220 / 360);
    const usedLen = arcLen * pct;
    const startAngle = 200; // graus, sentido anti-horário a partir da direita

    // Converte para stroke-dasharray/offset trick com rotate
    const corAlerta = pct >= 0.9 ? '#ef4444' : pct >= 0.75 ? '#f59e0b' : cor;

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="100" height="72" viewBox="0 0 100 72">
                {/* Trilha */}
                <path
                    d="M 14 65 A 36 36 0 1 1 86 65"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    strokeLinecap="round"
                />
                {/* Preenchimento */}
                <path
                    d="M 14 65 A 36 36 0 1 1 86 65"
                    fill="none"
                    stroke={corAlerta}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${usedLen} ${arcLen - usedLen}`}
                    style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.3s ease' }}
                />
                {/* Percentual */}
                <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e293b">
                    {Math.round(pct * 100)}%
                </text>
            </svg>
            <p className="text-xs font-semibold text-slate-700 truncate max-w-[100px] text-center">{nome}</p>
            <p className="text-[10px] text-slate-400">
                R$ {Number(usado).toFixed(0)} / R$ {Number(limite).toFixed(0)}
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Mini Sparkline (SVG inline)
// ─────────────────────────────────────────────────────────────
function Sparkline({ values, color = '#6366f1', height = 32, width = 80 }) {
    if (!values || values.length < 2) return null;
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = max - min || 1;
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    });
    const polyline = pts.join(' ');
    const area = `${pts[0].split(',')[0]},${height} ` + polyline + ` ${pts[pts.length - 1].split(',')[0]},${height}`;
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <defs>
                <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={area} fill={`url(#grad-${color.replace('#', '')})`} />
            <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────
//  Gráfico de Barras — por mês
// ─────────────────────────────────────────────────────────────
function GraficoBarras({ contas }) {
    const mapaM = {};
    for (const c of contas) {
        const mes = (c.data_vencimento ?? '').substring(0, 7);
        if (!mes) continue;
        if (!mapaM[mes]) mapaM[mes] = { pagar: 0, receber: 0 };
        if (c.tipo === 'PAGAR') mapaM[mes].pagar += Number(c.valor);
        if (c.tipo === 'RECEBER') mapaM[mes].receber += Number(c.valor);
    }
    const meses = Object.keys(mapaM).sort().slice(-6);
    if (meses.length === 0) return (
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Sem dados para exibir.</div>
    );
    const maxVal = Math.max(...meses.flatMap((m) => [mapaM[m].pagar, mapaM[m].receber]), 1);
    const W = 540, H = 200, padL = 52, padB = 32, padT = 12;
    const chartW = W - padL - 16;
    const chartH = H - padB - padT;
    const slotW = chartW / meses.length;
    const barW = Math.min(20, (slotW - 10) / 2);
    const yVal = (v) => padT + chartH - (v / maxVal) * chartH;
    const ticks = [0, 0.5, 1].map((f) => ({
        y: padT + chartH * (1 - f),
        val: (maxVal * f / 1000).toFixed(0) + 'k',
    }));

    const mesLabels = {
        '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
        '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
        '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    };

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
            {ticks.map((t) => (
                <g key={t.y}>
                    <line x1={padL} y1={t.y} x2={W - 8} y2={t.y} stroke="#f1f5f9" strokeWidth="1.5" />
                    <text x={padL - 8} y={t.y + 4} textAnchor="end" fontSize="9" fill="#cbd5e1">{t.val}</text>
                </g>
            ))}
            {meses.map((mes, i) => {
                const cx = padL + slotW * i + slotW / 2;
                const hP = (mapaM[mes].pagar / maxVal) * chartH;
                const hR = (mapaM[mes].receber / maxVal) * chartH;
                const mm = mes.substring(5);
                return (
                    <g key={mes}>
                        <rect x={cx - barW - 2} y={yVal(mapaM[mes].pagar)} width={barW} height={hP} rx="3" fill="#ef4444" opacity="0.75" />
                        <rect x={cx + 2} y={yVal(mapaM[mes].receber)} width={barW} height={hR} rx="3" fill="#22c55e" opacity="0.75" />
                        <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{mesLabels[mm] ?? mm}</text>
                    </g>
                );
            })}
            <rect x={padL} y={H - padB + 6} width="8" height="8" rx="2" fill="#ef4444" opacity="0.75" />
            <text x={padL + 11} y={H - padB + 14} fontSize="9" fill="#94a3b8">A Pagar</text>
            <rect x={padL + 58} y={H - padB + 6} width="8" height="8" rx="2" fill="#22c55e" opacity="0.75" />
            <text x={padL + 71} y={H - padB + 14} fontSize="9" fill="#94a3b8">A Receber</text>
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────
//  Gráfico de Rosca — categorias
// ─────────────────────────────────────────────────────────────
function GraficoRosca({ contas, catMap }) {
    const mapaC = {};
    for (const c of contas) {
        const key = c.categoria_id ?? '__sem__';
        mapaC[key] = (mapaC[key] ?? 0) + Math.abs(Number(c.valor));
    }
    const entries = Object.entries(mapaC).sort((a, b) => b[1] - a[1]);
    const top5 = entries.slice(0, 5);
    const outros = entries.slice(5).reduce((s, [, v]) => s + v, 0);
    if (outros > 0) top5.push(['__outros__', outros]);
    const total = top5.reduce((s, [, v]) => s + v, 0);
    if (total === 0) return (
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Sem dados para exibir.</div>
    );
    const cx = 90, cy = 90, R = 70, r = 42;
    let angle = -Math.PI / 2;
    const arcs = top5.map(([key, val], i) => {
        const frac = val / total;
        const sweep = frac * 2 * Math.PI;
        const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
        const x2 = cx + R * Math.cos(angle + sweep), y2 = cy + R * Math.sin(angle + sweep);
        const ix1 = cx + r * Math.cos(angle), iy1 = cy + r * Math.sin(angle);
        const ix2 = cx + r * Math.cos(angle + sweep), iy2 = cy + r * Math.sin(angle + sweep);
        const large = sweep > Math.PI ? 1 : 0;
        const color = DONUT_COLORS[i % DONUT_COLORS.length];
        const label = key === '__sem__' ? 'Sem categoria' : key === '__outros__' ? 'Outros' : (catMap[key]?.descricao ?? `#${key}`);
        const d = [`M ${x1} ${y1}`, `A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`, `L ${ix2} ${iy2}`, `A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1}`, 'Z'].join(' ');
        angle += sweep;
        return { d, color, label, pct: (frac * 100).toFixed(1), val };
    });
    return (
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <svg viewBox="0 0 180 180" className="w-44 h-44 flex-shrink-0">
                {arcs.map((a, i) => (
                    <path key={i} d={a.d} fill={a.color} opacity="0.88" stroke="#fff" strokeWidth="2" />
                ))}
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">Total</text>
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">
                    {(total / 1000).toFixed(1)}k
                </text>
            </svg>
            <div className="flex flex-col gap-2 flex-1 w-full">
                {arcs.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
                        <span className="text-slate-600 flex-1 truncate text-xs">{a.label}</span>
                        <span className="text-slate-400 text-xs font-medium">{a.pct}%</span>
                        <span className="text-slate-700 text-xs font-semibold">R${(a.val / 1000).toFixed(1)}k</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Card KPI compacto
// ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color, trend, sparkValues }) {
    const colorMap = {
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', val: 'text-indigo-700' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', val: 'text-emerald-700' },
        red: { bg: 'bg-red-50', text: 'text-red-600', val: 'text-red-700' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', val: 'text-amber-700' },
        violet: { bg: 'bg-violet-50', text: 'text-violet-600', val: 'text-violet-700' },
    };
    const c = colorMap[color] ?? colorMap.indigo;
    const sparkColor = { indigo: '#6366f1', emerald: '#22c55e', red: '#ef4444', amber: '#f59e0b', violet: '#8b5cf6' }[color];

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-200 transition-all">
            <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${c.bg}`}>
                    <span className={c.text}>{icon}</span>
                </div>
                {sparkValues && sparkValues.length > 1 && (
                    <Sparkline values={sparkValues} color={sparkColor} />
                )}
                {trend !== undefined && !sparkValues && (
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full
                        ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-2xl font-black tracking-tight ${c.val}`}>{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Seção: Cartões — uso detalhado
// ─────────────────────────────────────────────────────────────
function SecaoCartoes({ cartoes }) {
    if (cartoes.length === 0) return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center">
            <CreditCard size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Nenhum cartão cadastrado.</p>
        </div>
    );

    const totalLimite = cartoes.reduce((s, c) => s + Number(c.limite ?? 0), 0);
    const totalUsado = cartoes.reduce((s, c) => s + Number(c.limite_usado ?? 0), 0);
    const totalLivre = cartoes.reduce((s, c) => s + Number(c.limite_livre ?? 0), 0);
    const pctTotal = totalLimite > 0 ? (totalUsado / totalLimite) * 100 : 0;

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-800 to-indigo-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-indigo-300" />
                    <h2 className="text-sm font-bold text-white">Cartões de Crédito</h2>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">Uso total</p>
                    <p className={`text-sm font-black ${pctTotal >= 90 ? 'text-red-400' : pctTotal >= 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {pctTotal.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Barra de uso consolidada */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Limite total utilizado</span>
                    <span className="font-semibold text-slate-700">
                        R$ {totalUsado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} / R$ {totalLimite.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                        className={`h-2.5 rounded-full transition-all duration-700 ${pctTotal >= 90 ? 'bg-red-500' : pctTotal >= 75 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(pctTotal, 100)}%` }}
                    />
                </div>
                <div className="flex gap-4 mt-2">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Usado: R$ {totalUsado.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Disponível: R$ {totalLivre.toFixed(0)}
                    </span>
                </div>
            </div>

            {/* Gauges por cartão */}
            <div className="p-5">
                <div className="flex flex-wrap gap-4 justify-around">
                    {cartoes.map((card, i) => (
                        <GaugeCartao
                            key={card.id}
                            nome={card.nome}
                            usado={Number(card.limite_usado ?? 0)}
                            limite={Number(card.limite ?? 0)}
                            cor={DONUT_COLORS[i % DONUT_COLORS.length]}
                        />
                    ))}
                </div>
            </div>

            {/* Tabela de cartões */}
            <div className="border-t border-slate-100 overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-xs text-slate-400 border-b border-slate-100">
                            <th className="px-5 py-2.5 font-semibold uppercase tracking-wider">Cartão</th>
                            <th className="px-5 py-2.5 font-semibold uppercase tracking-wider text-center">Venc.</th>
                            <th className="px-5 py-2.5 font-semibold uppercase tracking-wider text-right">Limite</th>
                            <th className="px-5 py-2.5 font-semibold uppercase tracking-wider text-right">Usado</th>
                            <th className="px-5 py-2.5 font-semibold uppercase tracking-wider text-right">Disponível</th>
                            <th className="px-5 py-2.5 font-semibold uppercase tracking-wider text-center">Uso</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {cartoes.map((card, i) => {
                            const pct = Number(card.limite) > 0
                                ? (Number(card.limite_usado ?? 0) / Number(card.limite)) * 100
                                : 0;
                            return (
                                <tr key={card.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] + '20' }}>
                                                <CreditCard size={13} style={{ color: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-800">{card.nome}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className="text-xs text-slate-500">Dia {card.dia_vencimento}</span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <span className="text-sm font-medium text-slate-600">
                                            R$ {Number(card.limite).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <span className={`text-sm font-semibold ${pct >= 90 ? 'text-red-600' : pct >= 75 ? 'text-amber-600' : 'text-slate-700'}`}>
                                            R$ {Number(card.limite_usado ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <span className="text-sm font-semibold text-emerald-600">
                                            R$ {Number(card.limite_livre ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2 justify-center">
                                            <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-1.5 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-bold w-9 text-right ${pct >= 90 ? 'text-red-500' : pct >= 75 ? 'text-amber-500' : 'text-slate-500'}`}>
                                                {pct.toFixed(0)}%
                                            </span>
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
//  Contas correntes — cards expandidos
// ─────────────────────────────────────────────────────────────
function SecaoContasCorrentes({ contasCorrentes }) {
    const totalSaldo = contasCorrentes.reduce((s, c) => s + Number(c.saldo ?? 0), 0);
    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wallet size={18} className="text-indigo-500" />
                    <h2 className="text-sm font-bold text-slate-700">Carteiras</h2>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">Saldo consolidado</p>
                    <p className={`text-sm font-black ${totalSaldo >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                        R$ {totalSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>
            <div className="divide-y divide-slate-50">
                {contasCorrentes.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-8">Nenhuma conta corrente cadastrada.</p>
                ) : contasCorrentes.map((cc) => {
                    const saldo = Number(cc.saldo ?? 0);
                    const pctTotal = totalSaldo > 0 ? (saldo / totalSaldo) * 100 : 0;
                    return (
                        <div key={cc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <Wallet size={16} className="text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800">{cc.descricao}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-1.5 rounded-full ${saldo >= 0 ? 'bg-indigo-400' : 'bg-red-400'}`}
                                            style={{ width: `${Math.min(Math.abs(pctTotal), 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-400">{Math.abs(pctTotal).toFixed(0)}% do total</span>
                                </div>
                            </div>
                            <p className={`text-sm font-black flex-shrink-0 ${saldo >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Próximos Vencimentos
// ─────────────────────────────────────────────────────────────
function ProximosVencimentos({ contas, catMap }) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const proximas = contas
        .filter((c) => c.status === 'Pendente')
        .map((c) => ({ ...c, _dt: new Date(c.data_vencimento + 'T00:00:00') }))
        .sort((a, b) => a._dt - b._dt)
        .slice(0, 8);

    if (proximas.length === 0) return (
        <p className="text-slate-400 text-sm py-6 text-center">Nenhuma conta pendente.</p>
    );

    return (
        <ul className="divide-y divide-slate-50">
            {proximas.map((c) => {
                const diff = Math.round((c._dt - hoje) / 86400000);
                const vence = diff < 0 ? `${Math.abs(diff)}d atraso` : diff === 0 ? 'Hoje' : `${diff}d`;
                const badge = diff < 0 ? 'bg-red-100 text-red-700' : diff === 0 ? 'bg-amber-100 text-amber-700' : diff <= 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500';
                const catNome = c.categoria_id ? (catMap[c.categoria_id]?.descricao ?? '') : '';
                return (
                    <li key={c.id} className="flex items-center justify-between py-3 gap-3 hover:bg-slate-50 px-1 rounded-lg transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                                ${c.tipo === 'RECEBER' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                {c.tipo === 'RECEBER'
                                    ? <TrendingUp size={13} className="text-emerald-600" />
                                    : <TrendingDown size={13} className="text-red-600" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{c.descricao}</p>
                                {catNome && <p className="text-xs text-slate-400 truncate">{catNome}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-sm font-semibold ${c.tipo === 'RECEBER' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {c.tipo === 'RECEBER' ? '+' : '-'} R$ {Number(c.valor).toFixed(2)}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${badge}`}>{vence}</span>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

// ─────────────────────────────────────────────────────────────
//  Fluxo de Caixa Projetado (próximos 30 dias)
// ─────────────────────────────────────────────────────────────
function FluxoCaixaProjetado({ contas, contasCorrentes }) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const em30 = new Date(hoje);
    em30.setDate(em30.getDate() + 30);

    const saldoAtual = contasCorrentes.reduce((s, c) => s + Number(c.saldo ?? 0), 0);

    const pendentes30 = contas.filter((c) => {
        if (c.status !== 'Pendente') return false;
        const dt = new Date(c.data_vencimento + 'T00:00:00');
        return dt >= hoje && dt <= em30;
    });

    const totalPagar = pendentes30.filter(c => c.tipo === 'PAGAR').reduce((s, c) => s + Number(c.valor), 0);
    const totalReceber = pendentes30.filter(c => c.tipo === 'RECEBER').reduce((s, c) => s + Number(c.valor), 0);
    const saldoProjetado = saldoAtual + totalReceber - totalPagar;

    const items = [
        { label: 'Saldo Atual', value: saldoAtual, color: 'text-slate-700', bg: 'bg-slate-100' },
        { label: '+ A Receber (30d)', value: totalReceber, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        { label: '- A Pagar (30d)', value: -totalPagar, color: 'text-red-700', bg: 'bg-red-50' },
        { label: 'Projeção 30d', value: saldoProjetado, color: saldoProjetado >= 0 ? 'text-indigo-700' : 'text-red-700', bg: saldoProjetado >= 0 ? 'bg-indigo-50' : 'bg-red-50', bold: true },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
                <Target size={18} className="text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-700">Fluxo Projetado — Próximos 30 Dias</h2>
            </div>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i}>
                        {i === items.length - 1 && <div className="border-t border-slate-200 my-2" />}
                        <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${item.bg}`}>
                            <span className={`text-sm ${item.bold ? 'font-bold' : 'font-medium'} text-slate-600`}>{item.label}</span>
                            <span className={`text-sm ${item.bold ? 'font-black text-base' : 'font-semibold'} ${item.color}`}>
                                {item.value >= 0 ? '' : ''}
                                R$ {Math.abs(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  Alertas Financeiros
// ─────────────────────────────────────────────────────────────
function AlertasFinanceiros({ contas, cartoes, contasCorrentes }) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const alertas = [];

    // Contas vencidas
    const vencidas = contas.filter((c) => {
        if (c.status !== 'Pendente') return false;
        const dt = new Date(c.data_vencimento + 'T00:00:00');
        return dt < hoje;
    });
    if (vencidas.length > 0) {
        const total = vencidas.reduce((s, c) => s + Number(c.valor), 0);
        alertas.push({
            tipo: 'error',
            msg: `${vencidas.length} conta${vencidas.length > 1 ? 's' : ''} vencida${vencidas.length > 1 ? 's' : ''} — R$ ${total.toFixed(2)} em atraso`,
        });
    }

    // Contas vencendo hoje ou amanhã
    const urgentes = contas.filter((c) => {
        if (c.status !== 'Pendente') return false;
        const dt = new Date(c.data_vencimento + 'T00:00:00');
        const diff = Math.round((dt - hoje) / 86400000);
        return diff === 0 || diff === 1;
    });
    if (urgentes.length > 0) {
        alertas.push({
            tipo: 'warning',
            msg: `${urgentes.length} conta${urgentes.length > 1 ? 's' : ''} vence${urgentes.length > 1 ? 'm' : ''} hoje ou amanhã`,
        });
    }

    // Cartões com uso > 80%
    cartoes.forEach((card) => {
        const pct = Number(card.limite) > 0 ? (Number(card.limite_usado ?? 0) / Number(card.limite)) * 100 : 0;
        if (pct >= 80) {
            alertas.push({
                tipo: pct >= 95 ? 'error' : 'warning',
                msg: `Cartão "${card.nome}" com ${pct.toFixed(0)}% do limite utilizado`,
            });
        }
    });

    // Saldo negativo
    contasCorrentes.forEach((cc) => {
        if (Number(cc.saldo) < 0) {
            alertas.push({
                tipo: 'error',
                msg: `Conta "${cc.descricao}" com saldo negativo: R$ ${Number(cc.saldo).toFixed(2)}`,
            });
        }
    });

    if (alertas.length === 0) return (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-700">Tudo em ordem! Nenhum alerta financeiro.</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-2">
            {alertas.map((a, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border
                    ${a.tipo === 'error' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <AlertCircle size={16} className={`flex-shrink-0 mt-0.5 ${a.tipo === 'error' ? 'text-red-500' : 'text-amber-500'}`} />
                    <p className={`text-sm font-medium ${a.tipo === 'error' ? 'text-red-700' : 'text-amber-700'}`}>{a.msg}</p>
                </div>
            ))}
        </div>
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

    // ── KPIs derivados ─────────────────────────────────────────
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const contasPagas = contas.filter(c => c.status === 'Pago' || c.status === 'PAGO');
    const contasPendentes = contas.filter(c => c.status === 'Pendente');
    const contasVencidas = contasPendentes.filter(c => new Date(c.data_vencimento + 'T00:00:00') < hoje);

    const saldoTotal = contasCorrentes.reduce((s, c) => s + Number(c.saldo ?? 0), 0);
    const totalLimiteCartoes = cartoes.reduce((s, c) => s + Number(c.limite ?? 0), 0);
    const totalUsadoCartoes = cartoes.reduce((s, c) => s + Number(c.limite_usado ?? 0), 0);
    const totalLivreCartoes = cartoes.reduce((s, c) => s + Number(c.limite_livre ?? 0), 0);

    const somaReceber = contasPendentes.filter(c => c.tipo === 'RECEBER').reduce((s, c) => s + Number(c.valor), 0);
    const somaPagar = contasPendentes.filter(c => c.tipo === 'PAGAR').reduce((s, c) => s + Number(c.valor), 0);

    // Sparkline por mês (saldo pago - a pagar)
    const mapaM = {};
    for (const c of contas) {
        const mes = (c.data_vencimento ?? '').substring(0, 7);
        if (!mes) continue;
        if (!mapaM[mes]) mapaM[mes] = { val: 0 };
        mapaM[mes].val += c.tipo === 'RECEBER' ? Number(c.valor) : -Number(c.valor);
    }
    const sparkData = Object.keys(mapaM).sort().slice(-6).map(m => mapaM[m].val);

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
                    <p className="text-slate-400 mt-0.5 text-sm">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button onClick={carregar}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors border border-slate-200">
                    <Activity size={13} />
                    Atualizar
                </button>
            </header>

            {/* Alertas */}
            <AlertasFinanceiros contas={contas} cartoes={cartoes} contasCorrentes={contasCorrentes} />

            {/* KPI Cards — linha 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Saldo Total"
                    value={`R$ ${saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    sub={`${contasCorrentes.length} conta${contasCorrentes.length !== 1 ? 's' : ''} corrente`}
                    icon={<Wallet size={20} />}
                    color={saldoTotal >= 0 ? 'indigo' : 'red'}
                    sparkValues={sparkData}
                />
                <KpiCard
                    label="A Receber"
                    value={`R$ ${somaReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    sub={`${contasPendentes.filter(c => c.tipo === 'RECEBER').length} contas pendentes`}
                    icon={<TrendingUp size={20} />}
                    color="emerald"
                />
                <KpiCard
                    label="A Pagar"
                    value={`R$ ${somaPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    sub={`${contasPendentes.filter(c => c.tipo === 'PAGAR').length} contas pendentes`}
                    icon={<TrendingDown size={20} />}
                    color="red"
                />
                <KpiCard
                    label="Crédito Disponível"
                    value={`R$ ${totalLivreCartoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    sub={`de R$ ${totalLimiteCartoes.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} total`}
                    icon={<CreditCard size={20} />}
                    color="violet"
                />
            </div>

            {/* KPI Cards — linha 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Contas Pagas"
                    value={contasPagas.length}
                    sub="lançamentos liquidados"
                    icon={<CheckCircle2 size={20} />}
                    color="emerald"
                />
                <KpiCard
                    label="Pendentes"
                    value={contasPendentes.length}
                    sub="aguardando pagamento"
                    icon={<Clock size={20} />}
                    color="amber"
                />
                <KpiCard
                    label="Em Atraso"
                    value={contasVencidas.length}
                    sub={contasVencidas.length > 0 ? `R$ ${contasVencidas.reduce((s, c) => s + Number(c.valor), 0).toFixed(2)}` : 'nenhuma vencida'}
                    icon={<AlertCircle size={20} />}
                    color={contasVencidas.length > 0 ? 'red' : 'emerald'}
                />
                <KpiCard
                    label="Uso Cartões"
                    value={totalLimiteCartoes > 0 ? `${((totalUsadoCartoes / totalLimiteCartoes) * 100).toFixed(1)}%` : '—'}
                    sub={`R$ ${totalUsadoCartoes.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} utilizado`}
                    icon={<Zap size={20} />}
                    color={totalLimiteCartoes > 0 && (totalUsadoCartoes / totalLimiteCartoes) >= 0.8 ? 'red' : 'violet'}
                />
            </div>

            {/* Cartões — seção principal */}
            {cartoes.length > 0 && <SecaoCartoes cartoes={cartoes} />}

            {/* Contas correntes + fluxo projetado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SecaoContasCorrentes contasCorrentes={contasCorrentes} />
                <FluxoCaixaProjetado contas={contas} contasCorrentes={contasCorrentes} />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 size={18} className="text-indigo-500" />
                        <h2 className="text-sm font-bold text-slate-700">Contas por Mês</h2>
                        <span className="text-xs text-slate-400 ml-auto">Últimos 6 meses</span>
                    </div>
                    <GraficoBarras contas={contas} />
                </div>
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart size={18} className="text-violet-500" />
                        <h2 className="text-sm font-bold text-slate-700">Distribuição por Categoria</h2>
                    </div>
                    <GraficoRosca contas={contas} catMap={catMap} />
                </div>
            </div>

            {/* Próximos vencimentos */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <CalendarClock size={18} className="text-amber-500" />
                        <h2 className="text-sm font-bold text-slate-700">Próximos Vencimentos</h2>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                        {contasPendentes.length} pendente{contasPendentes.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <ProximosVencimentos contas={contas} catMap={catMap} />
            </div>
        </div>
    );
}