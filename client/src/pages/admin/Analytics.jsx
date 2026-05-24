import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import LineChartCard from '../../components/charts/LineChartCard.jsx';
import BarChartCard from '../../components/charts/BarChartCard.jsx';
import { useOverview, useUsageSeries, useGrowthSeries, useSummaryTypeBreakdown } from '../../services/queries/analytics.js';

export default function Analytics() {
  const overview = useOverview();
  const usage = useUsageSeries(14);
  const growth = useGrowthSeries(30);
  const breakdown = useSummaryTypeBreakdown(30);

  const usageDaily = useMemo(() => {
    const series = usage.data?.series || [];
    const byDay = new Map();
    series.forEach((r) => byDay.set(r.day, (byDay.get(r.day) || 0) + r.count));
    return Array.from(byDay.entries()).map(([day, count]) => ({ day, count }));
  }, [usage.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Usage, growth, and what people are summarizing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={overview.data?.users?.total} loading={overview.isLoading} />
        <Stat label="Active users" value={overview.data?.users?.active} loading={overview.isLoading} />
        <Stat label="Summaries (30d)" value={overview.data?.summaries?.last30d} loading={overview.isLoading} />
        <Stat label="Failed (7d)" value={overview.data?.summaries?.failedLast7d} loading={overview.isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LineChartCard title="Summaries per day (14d)" data={usageDaily} />
        <LineChartCard title="New users per day (30d)" data={growth.data?.series || []} />
      </div>

      <BarChartCard title="By summary type (30d)" data={breakdown.data?.breakdown || []} xKey="summaryType" />
    </div>
  );
}

function Stat({ label, value, loading }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold">{value ?? '—'}</p>}
      </CardContent>
    </Card>
  );
}
