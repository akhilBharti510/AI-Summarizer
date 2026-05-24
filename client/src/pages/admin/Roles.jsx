import { useState } from 'react';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { Input } from '../../components/ui/input.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/ui/dropdown-menu.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useRoles, useDeleteRole, useSetRoleStatus } from '../../services/queries/roles.js';
import RoleDialog from '../../features/admin-roles/RoleDialog.jsx';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../lib/utils.js';

export default function Roles() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useRoles({ q, page, limit: 20 });
  const del = useDeleteRole();
  const setStatus = useSetRoleStatus();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="text-sm text-muted-foreground">Define what each role can do.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New role</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Limit</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10" /></TableCell></TableRow>
              ))
            ) : (data?.data || []).length === 0 ? (
              <TableRow><TableCell colSpan={5}><EmptyState title="No roles" /></TableCell></TableRow>
            ) : (
              data.data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.name} {r.isSystem && <Badge variant="outline" className="ml-2 text-[10px]">system</Badge>}</div>
                    <div className="text-xs text-muted-foreground">{r.description}</div>
                  </TableCell>
                  <TableCell>{r.dailyLimit === -1 ? 'Unlimited' : r.dailyLimit}</TableCell>
                  <TableCell>{r.userCount}</TableCell>
                  <TableCell>
                    {r.status === 'ACTIVE' ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(r)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            try { await setStatus.mutateAsync({ id: r.id, active: r.status !== 'ACTIVE' }); }
                            catch (e) { toast.error(getApiErrorMessage(e)); }
                          }}
                        >
                          {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        {!r.isSystem && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={async () => {
                              if (!confirm(`Delete role ${r.name}?`)) return;
                              try { await del.mutateAsync(r.id); toast.success('Deleted'); }
                              catch (e) { toast.error(getApiErrorMessage(e)); }
                            }}
                          >Delete</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination pagination={data?.meta?.pagination} onChange={setPage} />

      <RoleDialog open={creating} onOpenChange={setCreating} />
      <RoleDialog role={editing} open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
}
