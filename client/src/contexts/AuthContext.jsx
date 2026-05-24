import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap, clearCsrf } from '../services/api.js';

const AuthCtx = createContext(null);

async function fetchMe() {
  try {
    const data = await unwrap(api.get('/auth/me'));
    return data?.user || null;
  } catch (e) {
    if (e?.response?.status === 401) return null;
    throw e;
  }
}

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    staleTime: 60_000,
    retry: false,
  });

  const value = {
    user: user ?? null,
    isLoading,
    isAuthenticated: Boolean(user),
    role: user?.role?.name ?? null,
    permissions: user?.role?.permissions ?? [],
    hasPermission: (p) => Boolean(user?.role?.permissions?.includes(p)),
    refresh: refetch,
    logout: async () => {
      try {
        await api.post('/auth/logout');
      } catch {}
      clearCsrf();
      qc.setQueryData(['me'], null);
      qc.clear();
    },
    setUser: (u) => qc.setQueryData(['me'], u),
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
