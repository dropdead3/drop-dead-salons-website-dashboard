import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { ComparisonResult } from '@/hooks/useComparisonData';

interface ComparisonChartProps {
  data: ComparisonResult | undefined;
  isLoading: boolean;
  periodALabel?: string;
  periodBLabel?: string;
}

export function ComparisonChart({ 
  data, 
  isLoading,
  periodALabel = 'Period A',
  periodBLabel = 'Period B',
}: ComparisonChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const chartData = [
    {
      name: 'Total Revenue',
      periodA: data.periodA.totalRevenue,
      periodB: data.periodB.totalRevenue,
    },
    {
      name: 'Services',
      periodA: data.periodA.serviceRevenue,
      periodB: data.periodB.serviceRevenue,
    },
    {
      name: 'Products',
      periodA: data.periodA.productRevenue,
      periodB: data.periodB.productRevenue,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display">REVENUE BREAKDOWN</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
              <XAxis 
                type="number" 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar 
                dataKey="periodA" 
                name={periodALabel}
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]}
              />
              <Bar 
                dataKey="periodB" 
                name={periodBLabel}
                fill="hsl(var(--muted-foreground) / 0.4)" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
