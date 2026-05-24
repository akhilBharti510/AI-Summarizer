import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, unwrapFull } from '../api.js';

export const useBookmarks = (params = {}) =>
  useQuery({
    queryKey: ['bookmarks', params],
    queryFn: async () => unwrapFull(api.get('/bookmarks', { params })),
    placeholderData: keepPreviousData,
  });

export const useRemoveBookmark = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/bookmarks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
  });
};
