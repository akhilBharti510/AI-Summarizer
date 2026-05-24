import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api, unwrapFull } from '../api.js';

export const useAuditLogs = (params = {}) =>
  useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => unwrapFull(api.get('/audit-logs', { params })),
    placeholderData: keepPreviousData,
  });
