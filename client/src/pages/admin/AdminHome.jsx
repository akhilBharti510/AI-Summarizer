import { Link } from 'react-router-dom';
import { Users, KeyRound, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card.jsx';
import { useOverview } from '../../services/queries/analytics.js';
import { Skeleton } from '../../components/ui/skeleton.jsx';

export default function AdminHome() {
  const { data, isLoading } = useOverview();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-muted-foreground">Manage users, roles, and platform health.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={data?.users?.total} loading={isLoading} />
        <Stat label="Active users" value={data?.users?.active} loading={isLoading} />
        <Stat label="Roles" value={data?.roles?.total} loading={isLoading} />
        <Stat label="Summaries today" value={data?.summaries?.today} loading={isLoading} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Tile to="/admin/users" icon={Users} title="Users" desc="Roles, activation, usage" />
        <Tile to="/admin/roles" icon={KeyRound} title="Roles" desc="Create roles & set permissions" />
        <Tile to="/admin/audit-logs" icon={Activity} title="Audit logs" desc="Who did what, when" />
        <Tile to="/admin/analytics" icon={BarChart3} title="Analytics" desc="Usage and growth" />
      </div>
    </div>
  );
}

function Stat({ label, value, loading }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        {loading ? <Skeleton className="mt-1 h-7 w-16" /> : <p className="text-2xl font-bold">{value ?? '—'}</p>}
      </CardContent>
    </Card>
  );
}

function Tile({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to} className="block">
      <Card className="transition-colors hover:bg-accent/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-secondary p-2"><Icon className="h-5 w-5" /></div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
