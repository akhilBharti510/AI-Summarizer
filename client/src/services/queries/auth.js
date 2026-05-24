import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap, clearCsrf } from '../api.js';

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => unwrap(api.post('/auth/login', body)),
    onSuccess: (data) => {
      clearCsrf();
      qc.setQueryData(['me'], data?.user || null);
    },
  });
};

export const useRegister = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => unwrap(api.post('/auth/register', body)),
    onSuccess: (data) => {
      clearCsrf();
      qc.setQueryData(['me'], data?.user || null);
    },
  });
};

export const useForgotPassword = () =>
  useMutation({ mutationFn: async (body) => unwrap(api.post('/auth/forgot-password', body)) });

export const useResetPassword = () =>
  useMutation({ mutationFn: async (body) => unwrap(api.post('/auth/reset-password', body)) });

export const useChangePassword = () =>
  useMutation({ mutationFn: async (body) => unwrap(api.post('/auth/change-password', body)) });
