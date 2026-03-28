// ============================================================
//  src/components/ResumoCards.jsx
//  Cards de resumo financeiro — compartilhado entre
//  ContasPage e DashboardPage.
// ============================================================

import React from 'react';
import { TrendingDown, TrendingUp, Clock, DollarSign } from 'lucide-react';

export default function ResumoCards({ contas }) {
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

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
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