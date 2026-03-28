// ============================================================
//  src/contexts/AuthContext.jsx
//  BUG 3 FIX: logout adicionado ao array de dependências do
//  useEffect que escuta 'auth:logout'.
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    authAPI,
    saveToken,
    saveUser,
    clearToken,
    getToken,
    getStoredUser,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getStoredUser);
    const [token, setToken] = useState(getToken);
    const [loading, setLoading] = useState(false);

    const logout = useCallback(() => {
        clearToken();
        setToken(null);
        setUser(null);
    }, []);

    // BUG 3 FIX — logout incluído no array de deps
    useEffect(() => {
        const handleLogout = () => logout();
        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, [logout]);

    // Hidrata o usuário ao montar (caso o token já exista no storage)
    useEffect(() => {
        if (token && !user) {
            authAPI.me()
                .then((u) => { setUser(u); saveUser(u); })
                .catch(() => logout());
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const data = await authAPI.login(email, password);
            saveToken(data.access_token);
            setToken(data.access_token);

            const me = await authAPI.me();
            saveUser(me);
            setUser(me);

            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const registrar = useCallback(async (nome, email, senha) => {
        setLoading(true);
        try {
            await authAPI.registrar(nome, email, senha);
            return await login(email, senha);
        } catch (err) {
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, [login]);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, registrar, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
    return ctx;
}