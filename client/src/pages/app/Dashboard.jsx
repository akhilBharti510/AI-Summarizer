import { Link } from 'react-router-dom';
import { Sparkles, FileText, Bookmark, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useDashboard } from '../../services/queries/dashboard.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { formatRelative } from '../../lib/utils.js';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useDashboard();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-muted-foreground">Here's your snapshot for today.</p>
      </div>

      {error && <ErrorState error={error} onRetry={refetch} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Sparkles}
          label="Quota today"
          value={
            isLoading
              ? '—'
              : data?.quota?.limit === -1
                ? 'Unlimited'
                : `${data?.quota?.used} / ${data?.quota?.limit}`
          }
          hint={data?.quota?.limit !== -1 ? `${data?.quota?.remaining} remaining` : null}
          loading={isLoading}
        />
        <StatCard icon={FileText} label="Total summaries" value={data?.totals?.summaries ?? 0} loading={isLoading} />
        <StatCard icon={Bookmark} label="Bookmarks" value={data?.totals?.bookmarks ?? 0} loading={isLoading} />
        <StatCard icon={Bell} label="Unread alerts" value={data?.unreadNotifications ?? 0} loading={isLoading} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent summaries</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </div>
            <Button asChild size="sm"><Link to="/summarize">New summary</Link></Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (data?.recent || []).length === 0 ? (
            <EmptyState
              title="No summaries yet"
              description="Generate your first summary to see it here."
              action={<Button asChild><Link to="/summarize">Get started</Link></Button>}
            />
          ) : (
            <ul className="divide-y">
              {data.recent.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.sourceType} · {s.summaryType} · {formatRelative(s.createdAt)}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm"><Link to={`/history?id=${s.id}`}>Open</Link></Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, loading }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-md bg-secondary p-2"><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-1 h-6 w-20" /> : <p className="text-xl font-bold">{value}</p>}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
