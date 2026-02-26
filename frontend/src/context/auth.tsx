"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { TOKEN_STORAGE_KEY, buildApiUrl, parseJsonResponse } from "@/lib/api";

type Role = "student" | "teacher";

type AuthUser = {
  id: number;
  username: string;
  role: Role;
};

type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  role: Role;
  username: string;
};

type RegisterPayload = {
  username: string;
  password: string;
  role: Role;
  invite_code?: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  token: null,
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshMe: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {}
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    const response = await fetch(buildApiUrl("/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await parseJsonResponse<AuthUser>(response);
    setUser(payload);
  }, [token]);

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      try {
        const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (!stored) return;
        if (!mounted) return;
        setToken(stored);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    refreshMe().catch(() => logout());
  }, [token, refreshMe, logout]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await fetch(buildApiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const payload = await parseJsonResponse<LoginResponse>(response);
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, payload.access_token);
    } catch {}
    setToken(payload.access_token);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await fetch(buildApiUrl("/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await parseJsonResponse(response);
  }, []);

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout, refreshMe }),
    [token, user, loading, login, register, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
