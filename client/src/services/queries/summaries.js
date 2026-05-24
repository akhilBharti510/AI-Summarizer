import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, unwrap, unwrapFull } from '../api.js';

export const useSummaries = (params = {}) =>
  useQuery({
    queryKey: ['summaries', params],
    queryFn: async () => unwrapFull(api.get('/summaries', { params })),
    placeholderData: keepPreviousData,
  });

export const useSummary = (id) =>
  useQuery({
    queryKey: ['summary', id],
    queryFn: async () => unwrap(api.get(`/summaries/${id}`)),
    enabled: Boolean(id),
  });

export const useCreateSummary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, file }) => {
      if (file) {
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => v !== undefined && v !== null && fd.append(k, v));
        fd.append('file', file);
        return unwrap(api.post('/summaries', fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
      }
      return unwrap(api.post('/summaries', data));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['summaries'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useRegenerateSummary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, options }) => unwrap(api.post(`/summaries/${id}/regenerate`, options || {})),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['summaries'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['summary', id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useRenameSummary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }) => unwrap(api.patch(`/summaries/${id}`, { title })),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['summaries'] });
      qc.invalidateQueries({ queryKey: ['summary', id] });
    },
  });
};

export const useDeleteSummary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/summaries/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['summaries'] }),
  });
};

export const useToggleBookmark = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => unwrap(api.post(`/summaries/${id}/bookmark`)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['summaries'] });
      qc.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
};

export async function downloadExport(id, format) {
  const r = await api.get(`/summaries/${id}/export`, { params: { format }, responseType: 'blob' });
  const blob = new Blob([r.data]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ext = format === 'pdf' ? 'pdf' : 'txt';
  a.download = `summary-${id}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
