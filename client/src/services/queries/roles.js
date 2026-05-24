import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, unwrap, unwrapFull } from '../api.js';

export const useRoles = (params = {}) =>
  useQuery({
    queryKey: ['roles', params],
    queryFn: async () => unwrapFull(api.get('/roles', { params })),
    placeholderData: keepPreviousData,
  });

export const usePermissionCatalog = () =>
  useQuery({
    queryKey: ['roles', 'permissions-catalog'],
    queryFn: async () => unwrap(api.get('/roles/permissions/catalog')),
    staleTime: 5 * 60_000,
  });

export const useCreateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => unwrap(api.post('/roles', body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
};
export const useUpdateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }) => unwrap(api.patch(`/roles/${id}`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
};
export const useDeleteRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/roles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
};
export const useSetRoleStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }) => unwrap(api.post(`/roles/${id}/${active ? 'activate' : 'deactivate'}`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
};
