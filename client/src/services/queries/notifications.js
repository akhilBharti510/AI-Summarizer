import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrapFull } from '../api.js';

export const useNotifications = (params = {}) =>
  useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => unwrapFull(api.get('/notifications', { params })),
    refetchInterval: 60_000,
  });

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};
