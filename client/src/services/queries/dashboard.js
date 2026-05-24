import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../api.js';

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: async () => unwrap(api.get('/dashboard/me')) });
