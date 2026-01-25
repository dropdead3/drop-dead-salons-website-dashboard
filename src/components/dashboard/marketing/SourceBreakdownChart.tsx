import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SourcePerformance, formatSourceName, getSourceColor } from '@/hooks/useMarketingAnalytics';

interface SourceBreakdownChartProps {
  sources: SourcePerformance[];
  isLoading?: boolean;
}

export function SourceBreakdownChart({ sources, isLoading }: SourceBreakdownChartProps) {
  const chartData = sources.map(s => ({
    name: formatSourceName(s.source),
    leads: s.leads,
    conversions: s.conversions,
    revenue: s.revenue,
    color: getSourceColor(s.source),
  }));

  const totalLeads = sources.reduce((sum, s) => sum + s.leads, 0);

  if (isLoading) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">LEADS BY SOURCE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sources.length === 0) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">LEADS BY SOURCE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No source data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">LEADS BY SOURCE</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 12 }} 
                stroke="hsl(var(--muted-foreground))"
                width={75}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'leads') {
                    const percent = totalLeads > 0 ? ((value / totalLeads) * 100).toFixed(1) : 0;
                    return [`${value} (${percent}%)`, 'Leads'];
                  }
                  return [value, name];
                }}
              />
              <Bar dataKey="leads" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend with percentages */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {chartData.slice(0, 4).map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground truncate">{item.name}</span>
              <span className="font-medium ml-auto tabular-nums">
                {totalLeads > 0 ? ((item.leads / totalLeads) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
