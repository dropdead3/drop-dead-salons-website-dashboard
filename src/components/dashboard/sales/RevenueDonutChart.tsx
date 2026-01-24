import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useHideNumbers } from '@/contexts/HideNumbersContext';

interface RevenueDonutChartProps {
  serviceRevenue: number;
  productRevenue: number;
  size?: number;
}

export function RevenueDonutChart({ 
  serviceRevenue, 
  productRevenue,
  size = 80 
}: RevenueDonutChartProps) {
  const { hideNumbers } = useHideNumbers();
  
  const data = useMemo(() => {
    const total = serviceRevenue + productRevenue;
    if (total === 0) return [];
    return [
      { name: 'Services', value: serviceRevenue, color: 'hsl(var(--primary))' },
      { name: 'Products', value: productRevenue, color: 'hsl(var(--chart-2))' },
    ].filter(d => d.value > 0);
  }, [serviceRevenue, productRevenue]);

  const total = serviceRevenue + productRevenue;
  const servicePercent = total > 0 ? Math.round((serviceRevenue / total) * 100) : 0;

  if (!data.length) {
    return (
      <div 
        className="flex items-center justify-center text-muted-foreground text-xs"
        style={{ width: size, height: size }}
      >
        No data
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.35}
              outerRadius={size * 0.45}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {!hideNumbers && (
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">Services</span>
          <span className="font-medium">{servicePercent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-chart-2" />
          <span className="text-muted-foreground">Products</span>
          <span className="font-medium">{100 - servicePercent}%</span>
        </div>
        <div className="pt-2 mt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Retail %</span>
            <span className="font-semibold text-foreground">
              {100 - servicePercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
