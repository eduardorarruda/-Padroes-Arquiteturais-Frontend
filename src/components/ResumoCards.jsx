// ============================================================
//  src/components/ResumoCards.jsx
//  Cards de resumo financeiro — compartilhado entre
//  ContasPage e DashboardPage.
// ============================================================

import React from 'react';
import { TrendingDown, TrendingUp, Wallet, CreditCard } from 'lucide-react';

export default function ResumoCards({ contas = [], contasCorrentes = [], cartoes = [] }) {
    // Calcula valores das contas
    const pendentes = contas.filter((c) => c.status === 'Pendente');
    const pagarPendentes = pendentes.filter((c) => c.tipo === 'PAGAR');
    const receberPendentes = pendentes.filter((c) => c.tipo === 'RECEBER');

    const somaPagar = pagarPendentes.reduce((s, c) => s + Number(c.valor), 0);
    const somaReceber = receberPendentes.reduce((s, c) => s + Number(c.valor), 0);
    
    // Calcula saldos de Carteiras e Cartões
    const saldoAtual = contasCorrentes.reduce((s, c) => s + Number(c.saldo ?? 0), 0);
    const limiteDisponivel = cartoes.reduce((s, c) => s + Number(c.limite_livre ?? 0), 0);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Wallet size={24} /></div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Saldo Atual</p>
                    <p className={`text-2xl font-black tracking-tight ${saldoAtual >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                        R$ {saldoAtual.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={24} /></div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">A Receber</p>
                    <p className="text-2xl font-black text-emerald-600 tracking-tight">R$ {somaReceber.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl"><TrendingDown size={24} /></div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">A Pagar</p>
                    <p className="text-2xl font-black text-red-600 tracking-tight">R$ {somaPagar.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><CreditCard size={24} /></div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Disponível Cartões</p>
                    <p className="text-2xl font-black text-violet-600 tracking-tight">R$ {limiteDisponivel.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
}