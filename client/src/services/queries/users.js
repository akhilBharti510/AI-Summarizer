import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, unwrap, unwrapFull } from '../api.js';

export const useUsers = (params = {}) =>
  useQuery({
    queryKey: ['users', params],
    queryFn: async () => unwrapFull(api.get('/users', { params })),
    placeholderData: keepPreviousData,
  });

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }) => unwrap(api.patch(`/users/${id}`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useResetUsage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => unwrap(api.post(`/users/${id}/reset-usage`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useDeactivateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => unwrap(api.delete(`/users/${id}`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useMyProfile = () =>
  useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => unwrap(api.get('/users/me/profile')),
  });

export const useUpdateMyProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => unwrap(api.patch('/users/me/profile', body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
};
