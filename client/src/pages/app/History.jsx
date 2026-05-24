import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '../../components/ui/input.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.jsx';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import SummaryCard from '../../features/summaries/SummaryCard.jsx';
import SummaryDetail from '../../features/summaries/SummaryDetail.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import {
  useSummaries,
  useToggleBookmark,
  useDeleteSummary,
  useRegenerateSummary,
  downloadExport,
} from '../../services/queries/summaries.js';
import { SOURCE_TYPES, SUMMARY_TYPES } from '../../features/summaries/constants.js';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../../lib/utils.js';

const ALL = '__ALL__';

export default function History() {
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const [sourceType, setSourceType] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [page, setPage] = useState(1);

  const params = {
    page,
    limit: 12,
    ...(q ? { q } : {}),
    ...(sourceType !== ALL ? { sourceType } : {}),
    ...(type !== ALL ? { type } : {}),
  };
  const { data, isLoading, error, refetch } = useSummaries(params);
  const bookmark = useToggleBookmark();
  const remove = useDeleteSummary();
  const regen = useRegenerateSummary();

  const activeId = sp.get('id');
  const closeDetail = () => { sp.delete('id'); setSp(sp, { replace: true }); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">History</h1>
          <p className="text-sm text-muted-foreground">All your past summaries.</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search title or content…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <Select value={sourceType} onValueChange={(v) => { setSourceType(v); setPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All sources</SelectItem>
            {SOURCE_TYPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {SUMMARY_TYPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {error && <ErrorState error={error} onRetry={refetch} />}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : (data?.data || []).length === 0 ? (
        <EmptyState title="No matching summaries" description="Try a different filter or create a new one." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((s) => (
            <SummaryCard
              key={s.id}
              summary={s}
              onBookmark={async () => {
                try { await bookmark.mutateAsync(s.id); } catch (e) { toast.error(getApiErrorMessage(e)); }
              }}
              onDelete={async () => {
                if (!confirm('Delete this summary?')) return;
                try { await remove.mutateAsync(s.id); toast.success('Deleted'); }
                catch (e) { toast.error(getApiErrorMessage(e)); }
              }}
              onRegenerate={async () => {
                try {
                  await regen.mutateAsync({ id: s.id, options: {} });
                  toast.success('Regenerated');
                } catch (e) { toast.error(getApiErrorMessage(e)); }
              }}
              onExport={(summary, fmt) => downloadExport(summary.id, fmt)}
            />
          ))}
        </div>
      )}

      <Pagination pagination={data?.meta?.pagination} onChange={setPage} />

      <SummaryDetail id={activeId} open={Boolean(activeId)} onOpenChange={(o) => !o && closeDetail()} />
    </div>
  );
}
