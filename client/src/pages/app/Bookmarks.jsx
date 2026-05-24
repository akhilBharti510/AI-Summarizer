import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/input.jsx';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardContent } from '../../components/ui/card.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useBookmarks, useRemoveBookmark } from '../../services/queries/bookmarks.js';
import { toast } from 'sonner';
import { getApiErrorMessage, formatRelative } from '../../lib/utils.js';

export default function Bookmarks() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useBookmarks({ q, page, limit: 20 });
  const remove = useRemoveBookmark();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <p className="text-sm text-muted-foreground">Quick access to summaries you saved.</p>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search bookmarks…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>

      {error && <ErrorState error={error} onRetry={refetch} />}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (data?.data || []).length === 0 ? (
        <EmptyState title="No bookmarks yet" description="Star a summary from History to save it here." />
      ) : (
        <div className="space-y-2">
          {data.data.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link to={`/history?id=${b.summary.id}`} className="font-medium hover:underline">{b.summary.title}</Link>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">{b.summary.sourceType}</Badge>
                    <Badge variant="outline" className="text-[10px]">{b.summary.summaryType}</Badge>
                    <span className="text-xs text-muted-foreground">{formatRelative(b.createdAt)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    try { await remove.mutateAsync(b.id); toast.success('Removed'); }
                    catch (e) { toast.error(getApiErrorMessage(e)); }
                  }}
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination pagination={data?.meta?.pagination} onChange={setPage} />
    </div>
  );
}
