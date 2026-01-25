import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MediumPerformance, formatMediumName, getMediumColor } from '@/hooks/useMarketingAnalytics';

interface MediumDistributionChartProps {
  mediums: MediumPerformance[];
  isLoading?: boolean;
}

export function MediumDistributionChart({ mediums, isLoading }: MediumDistributionChartProps) {
  const chartData = mediums.map(m => ({
    name: formatMediumName(m.medium),
    value: m.leads,
    conversions: m.conversions,
    revenue: m.revenue,
    color: getMediumColor(m.medium),
  }));

  const totalLeads = mediums.reduce((sum, m) => sum + m.leads, 0);

  if (isLoading) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">LEADS BY MEDIUM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mediums.length === 0) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">LEADS BY MEDIUM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No medium data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label for small slices
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">LEADS BY MEDIUM</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                innerRadius={40}
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => {
                  const percent = totalLeads > 0 ? ((value / totalLeads) * 100).toFixed(1) : 0;
                  return [`${value} leads (${percent}%)`, name];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Custom legend */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground truncate">{item.name}</span>
              <span className="font-medium ml-auto tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
