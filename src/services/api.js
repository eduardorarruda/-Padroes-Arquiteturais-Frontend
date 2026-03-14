// ============================================================
//  src/services/api.js
//  Camada de serviço centralizada para todas as chamadas HTTP.
//  Injeta o token JWT automaticamente em cada requisição.
// ============================================================

// Caminho relativo → o proxy do Vite (vite.config.js) encaminha
// para http://127.0.0.1:8000 sem expor o host ao browser (resolve o CORS).
// Em produção, defina: VITE_API_URL=https://sua-api.com no .env
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

// ── Chave usada para persistência no localStorage ────────────
const TOKEN_KEY = 'fintrack_token';
const USER_KEY = 'fintrack_user';

// ── Helpers de token ─────────────────────────────────────────
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

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    // Sessão expirada → limpa storage e recarrega
    if (response.status === 401) {
        clearToken();
        window.dispatchEvent(new Event('auth:logout'));
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro ${response.status}`);
    }

    // 204 No Content
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
    /** POST /api/auth/login — retorna { access_token, token_type } */
    login: (email, password) =>
        requestFormData('/api/auth/login', { username: email, password }),

    /** POST /api/auth/registrar — retorna o usuário criado */
    registrar: (nome, email, senha) =>
        request('/api/auth/registrar', {
            method: 'POST',
            body: JSON.stringify({ nome, email, senha }),
        }),

    /** GET /api/auth/me — retorna dados do usuário logado */
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
};

export const parceirosAPI = {
    listar: () => request('/api/parceiros/'),
    criar: (nome, tipo) =>
        request('/api/parceiros/', {
            method: 'POST',
            body: JSON.stringify({ nome, tipo }),
        }),
};

// ────────────────────────────────────────────────────────────
//  CONTAS
// ────────────────────────────────────────────────────────────
export const contasAPI = {
    listar: (skip = 0, limit = 100) =>
        request(`/api/contas/?skip=${skip}&limit=${limit}`),

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
};