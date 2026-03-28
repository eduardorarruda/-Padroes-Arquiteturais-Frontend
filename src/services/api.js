// ============================================================
//  src/services/api.js
//  Camada de serviço centralizada para todas as chamadas HTTP.
//  Injeta o token JWT automaticamente em cada requisição.
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const TOKEN_KEY = 'fintrack_token';
const USER_KEY = 'fintrack_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};
export const getStoredUser = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
};
export const saveUser = (user) =>
    localStorage.setItem(USER_KEY, JSON.stringify(user));

// ── Função principal de requisição ───────────────────────────
async function request(path, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (response.status === 401) {
        clearToken();
        window.dispatchEvent(new Event('auth:logout'));
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
}

// ── Versão especial para form-data (login OAuth2) ─────────────
async function requestFormData(path, data) {
    const body = new URLSearchParams(data);
    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Credenciais inválidas.');
    }

    return response.json();
}

// ────────────────────────────────────────────────────────────
//  AUTH
// ────────────────────────────────────────────────────────────
export const authAPI = {
    login: (email, password) =>
        requestFormData('/api/auth/login', { username: email, password }),

    registrar: (nome, email, senha) =>
        request('/api/auth/registrar', {
            method: 'POST',
            body: JSON.stringify({ nome, email, senha }),
        }),

    me: () => request('/api/auth/me'),
};

// ────────────────────────────────────────────────────────────
//  CATEGORIAS
// ────────────────────────────────────────────────────────────
export const categoriasAPI = {
    listar: () => request('/api/categorias/'),

    criar: (descricao) =>
        request('/api/categorias/', {
            method: 'POST',
            body: JSON.stringify({ descricao }),
        }),

    // BUG 1 FIX — usa request() para injetar JWT
    deletar: (id) =>
        request(`/api/categorias/${id}`, { method: 'DELETE' }),

    // FEATURE 2 — editar categoria
    atualizar: (id, dados) =>
        request(`/api/categorias/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados),
        }),
};

// ────────────────────────────────────────────────────────────
//  PARCEIROS
// ────────────────────────────────────────────────────────────
export const parceirosAPI = {
    listar: () => request('/api/parceiros/'),

    criar: (nome, tipo) =>
        request('/api/parceiros/', {
            method: 'POST',
            body: JSON.stringify({ nome, tipo }),
        }),

    // BUG 1 FIX — usa request() para injetar JWT
    deletar: (id) =>
        request(`/api/parceiros/${id}`, { method: 'DELETE' }),

    // FEATURE 2 — editar parceiro
    atualizar: (id, dados) =>
        request(`/api/parceiros/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados),
        }),
};

// ────────────────────────────────────────────────────────────
//  CONTAS
// ────────────────────────────────────────────────────────────
export const contasAPI = {
    listar: (skip = 0, limit = 100) =>
        request(`/api/contas/?skip=${skip}&limit=${limit}`),

    listarPagar: (skip = 0, limit = 100) =>
        request(`/api/contas/pagar?skip=${skip}&limit=${limit}`),

    listarReceber: (skip = 0, limit = 100) =>
        request(`/api/contas/receber?skip=${skip}&limit=${limit}`),

    obter: (id) => request(`/api/contas/${id}`),

    criar: (dados) =>
        request('/api/contas/', {
            method: 'POST',
            body: JSON.stringify(dados),
        }),

    atualizar: (id, dados) =>
        request(`/api/contas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados),
        }),

    deletar: (id) =>
        request(`/api/contas/${id}`, { method: 'DELETE' }),

    baixar: (id, conta_corrente_id, data_pagamento) =>
        request(`/api/contas/${id}/baixa`, {
            method: 'PATCH',
            body: JSON.stringify({ conta_corrente_id, data_pagamento }),
        }),
};

// ────────────────────────────────────────────────────────────
//  CONTAS CORRENTES
// ────────────────────────────────────────────────────────────
export const contasCorrentesAPI = {
    listar: () => request('/api/contas-correntes/'),

    criar: (dados) =>
        request('/api/contas-correntes/', {
            method: 'POST',
            body: JSON.stringify(dados),
        }),

    atualizar: (id, dados) =>
        request(`/api/contas-correntes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados),
        }),

    deletar: (id) =>
        request(`/api/contas-correntes/${id}`, { method: 'DELETE' }),
};

// ────────────────────────────────────────────────────────────
//  CARTÕES DE CRÉDITO
// ────────────────────────────────────────────────────────────
export const cartoesAPI = {
    listar: () => request('/api/cartoes/'),

    criar: (dados) =>
        request('/api/cartoes/', {
            method: 'POST',
            body: JSON.stringify(dados),
        }),

    atualizar: (id, dados) =>
        request(`/api/cartoes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados),
        }),

    criarLancamento: (cartaoId, dados) =>
        request(`/api/cartoes/${cartaoId}/lancamentos`, {
            method: 'POST',
            body: JSON.stringify(dados),
        }),

    listarLancamentos: (cartaoId, mes, ano) =>
        request(`/api/cartoes/${cartaoId}/lancamentos?mes=${mes}&ano=${ano}`),

    fecharFatura: (cartaoId, mes, ano) =>
        request(`/api/cartoes/${cartaoId}/fatura/fechar`, {
            method: 'POST',
            body: JSON.stringify({ mes, ano }),
        }),
};