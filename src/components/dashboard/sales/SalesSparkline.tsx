import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface SalesSparklineProps {
  data: { date: string; value: number }[];
  color?: string;
  height?: number;
}

export function SalesSparkline({ 
  data, 
  color = 'hsl(var(--primary))',
  height = 32 
}: SalesSparklineProps) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      date: d.date,
      value: d.value,
    }));
  }, [data]);

  if (!chartData.length) {
    return (
      <div 
        className="flex items-center justify-center text-muted-foreground text-xs"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`${color.replace(')', ' / 0.2)').replace('hsl', 'hsl')}`}
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
