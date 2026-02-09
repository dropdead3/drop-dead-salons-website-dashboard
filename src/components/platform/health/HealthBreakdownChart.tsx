import * as React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { HealthBreakdown } from '@/hooks/useOrganizationHealth';

interface HealthBreakdownChartProps {
  breakdown: HealthBreakdown;
  className?: string;
}

export function HealthBreakdownChart({ breakdown, className }: HealthBreakdownChartProps) {
  const data = [
    {
      component: 'Adoption',
      score: breakdown.adoption.score,
      fullMark: 100,
    },
    {
      component: 'Engagement',
      score: breakdown.engagement.score,
      fullMark: 100,
    },
    {
      component: 'Performance',
      score: breakdown.performance.score,
      fullMark: 100,
    },
    {
      component: 'Data Quality',
      score: breakdown.data_quality.score,
      fullMark: 100,
    },
  ];

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis 
            dataKey="component" 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.4}
            strokeWidth={2}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-white font-medium">{data.component}</p>
                    <p className="text-violet-400">{data.score}/100</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
