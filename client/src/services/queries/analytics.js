import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../api.js';

export const useOverview = () =>
  useQuery({ queryKey: ['analytics', 'overview'], queryFn: async () => unwrap(api.get('/analytics/overview')) });

export const useUsageSeries = (days = 14) =>
  useQuery({
    queryKey: ['analytics', 'usage', days],
    queryFn: async () => unwrap(api.get('/analytics/usage', { params: { days } })),
  });

export const useGrowthSeries = (days = 30) =>
  useQuery({
    queryKey: ['analytics', 'growth', days],
    queryFn: async () => unwrap(api.get('/analytics/growth', { params: { days } })),
  });

export const useSummaryTypeBreakdown = (days = 30) =>
  useQuery({
    queryKey: ['analytics', 'types', days],
    queryFn: async () => unwrap(api.get('/analytics/summary-types', { params: { days } })),
  });
