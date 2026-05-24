import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../components/ui/input.jsx';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useAuditLogs } from '../../services/queries/audit.js';
import { formatDate } from '../../lib/utils.js';

export default function AuditLogs() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAuditLogs({ q, page, limit: 25 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Every privileged action, recorded.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search action or target…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10" /></TableCell></TableRow>
              ))
            ) : (data?.data || []).length === 0 ? (
              <TableRow><TableCell colSpan={5}><EmptyState title="No audit entries" /></TableCell></TableRow>
            ) : (
              data.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs">{formatDate(row.createdAt)}</TableCell>
                  <TableCell className="text-sm">{row.actor ? `${row.actor.name} (${row.actor.email})` : <span className="text-muted-foreground">system</span>}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-[10px]">{row.action}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{row.target || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.ip || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination pagination={data?.meta?.pagination} onChange={setPage} />
    </div>
  );
}
