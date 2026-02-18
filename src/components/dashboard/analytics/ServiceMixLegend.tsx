import { useMemo } from 'react';
import { useServiceCategoryColorsMap } from '@/hooks/useServiceCategoryColors';
import { isGradientMarker, getGradientFromMarker } from '@/utils/categoryColors';

function resolveHexColor(colorHex: string): string {
  if (!isGradientMarker(colorHex)) return colorHex;
  const grad = getGradientFromMarker(colorHex);
  if (!grad) return '#888888';
  const match = grad.background.match(/#[0-9a-fA-F]{6}/);
  return match ? match[0] : '#888888';
}

interface ServiceMixLegendProps {
  /** Record of category name → { revenue, count } or category name → number */
  byCategory: Record<string, number | { revenue: number; count: number }>;
}

/**
 * Compact horizontal legend showing service category breakdown with colored dots and percentages.
 * Designed to sit below the forecast bar chart when "By Category" mode is active.
 */
export function ServiceMixLegend({ byCategory }: ServiceMixLegendProps) {
  const { colorMap } = useServiceCategoryColorsMap();

  const items = useMemo(() => {
    const entries = Object.entries(byCategory)
      .map(([cat, val]) => [cat, typeof val === 'number' ? val : val.revenue] as [string, number])
      .filter(([, v]) => v > 0);
    const total = entries.reduce((sum, [, v]) => sum + v, 0);
    if (total === 0) return [];
    return entries
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([cat, val]) => ({
        category: cat,
        percentage: Math.round((val / total) * 100),
        color: resolveHexColor(colorMap[cat.toLowerCase()]?.bg || '#888888'),
      }));
  }, [byCategory, colorMap]);

  if (items.length === 0) return null;

  return (
    <div className="pt-3">
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent mb-3" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="text-xs font-medium text-muted-foreground mr-1">Service Mix</span>
        {items.map((item) => (
          <div key={item.category} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.category}</span>
            <span className="font-medium tabular-nums">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
