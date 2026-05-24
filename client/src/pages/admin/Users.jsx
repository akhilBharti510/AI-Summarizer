import { useState } from 'react';
import { Search, MoreHorizontal } from 'lucide-react';
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
import { useUsers, useResetUsage, useDeactivateUser } from '../../services/queries/users.js';
import EditUserDialog from '../../features/admin-users/EditUserDialog.jsx';
import { formatRelative, getApiErrorMessage } from '../../lib/utils.js';
import { toast } from 'sonner';

export default function Users() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useUsers({ q, page, limit: 20 });
  const reset = useResetUsage();
  const deactivate = useDeactivateUser();
  const [editing, setEditing] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">Manage roles, activation, and usage.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name or email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10" /></TableCell></TableRow>
              ))
            ) : (data?.data || []).length === 0 ? (
              <TableRow><TableCell colSpan={5}><EmptyState title="No users" /></TableCell></TableRow>
            ) : (
              data.data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{u.role?.name}</Badge></TableCell>
                  <TableCell>
                    {u.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.lastLoginAt ? formatRelative(u.lastLoginAt) : '—'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(u)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            try { await reset.mutateAsync(u.id); toast.success('Usage reset'); }
                            catch (e) { toast.error(getApiErrorMessage(e)); }
                          }}
                        >Reset usage</DropdownMenuItem>
                        {u.isActive && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={async () => {
                              if (!confirm(`Deactivate ${u.email}?`)) return;
                              try { await deactivate.mutateAsync(u.id); toast.success('Deactivated'); }
                              catch (e) { toast.error(getApiErrorMessage(e)); }
                            }}
                          >Deactivate</DropdownMenuItem>
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
      <EditUserDialog user={editing} open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
}
