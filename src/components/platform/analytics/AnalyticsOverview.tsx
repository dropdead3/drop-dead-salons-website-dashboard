import { Building2, MapPin, Users, DollarSign, UserPlus, Calendar, TrendingUp, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlatformTheme } from '@/contexts/PlatformThemeContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { PlatformAnalyticsSummary } from '@/hooks/useOrganizationAnalytics';

interface AnalyticsOverviewProps {
  analytics: PlatformAnalyticsSummary;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

const formatNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
};

export function AnalyticsOverview({ analytics }: AnalyticsOverviewProps) {
  const { resolvedTheme } = usePlatformTheme();
  const isDark = resolvedTheme === 'dark';

  const stats = [
    { label: 'Total Accounts', value: analytics.totalOrganizations, icon: Building2, color: 'violet' },
    { label: 'Active Accounts', value: analytics.activeOrganizations, icon: TrendingUp, color: 'emerald' },
    { label: 'Total Locations', value: analytics.totalLocations, icon: MapPin, color: 'blue' },
    { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'amber' },
    { label: 'Total Clients', value: formatNumber(analytics.totalClients), icon: UserPlus, color: 'pink' },
    { label: 'Total Appointments', value: formatNumber(analytics.totalAppointments), icon: Calendar, color: 'cyan' },
    { label: 'Platform MRR', value: formatCurrency(analytics.platformMRR), icon: DollarSign, color: 'emerald' },
    { label: 'Platform ARR', value: formatCurrency(analytics.platformARR), icon: DollarSign, color: 'violet' },
  ];

  const performanceStats = [
    { label: 'Avg Salon Revenue/Month', value: formatCurrency(analytics.avgRevenuePerOrg), color: 'emerald' },
    { label: 'Avg Revenue/Location', value: formatCurrency(analytics.avgRevenuePerLocation), color: 'blue' },
    { label: 'Platform Avg Rebooking', value: `${analytics.platformAvgRebooking.toFixed(1)}%`, color: 'violet' },
    { label: 'Platform Avg Retention', value: `${analytics.platformAvgRetention.toFixed(1)}%`, color: 'amber' },
    { label: 'Platform Avg Ticket', value: formatCurrency(analytics.platformAvgTicket), color: 'pink' },
    { label: 'Avg Retail Attachment', value: `${analytics.platformAvgRetailAttachment.toFixed(1)}%`, color: 'cyan' },
  ];

  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#06b6d4', '#84cc16'];

  const statusData = analytics.statusDistribution.map((item, index) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    color: COLORS[index % COLORS.length],
  }));

  const tierData = analytics.tierDistribution.map((item, index) => ({
    name: item.tier,
    value: item.count,
    mrr: item.mrr,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                'rounded-xl border p-4',
                isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  stat.color === 'violet' && (isDark ? 'bg-violet-500/20' : 'bg-violet-100'),
                  stat.color === 'emerald' && (isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'),
                  stat.color === 'blue' && (isDark ? 'bg-blue-500/20' : 'bg-blue-100'),
                  stat.color === 'amber' && (isDark ? 'bg-amber-500/20' : 'bg-amber-100'),
                  stat.color === 'pink' && (isDark ? 'bg-pink-500/20' : 'bg-pink-100'),
                  stat.color === 'cyan' && (isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'),
                )}>
                  <Icon className={cn(
                    'h-5 w-5',
                    stat.color === 'violet' && 'text-violet-500',
                    stat.color === 'emerald' && 'text-emerald-500',
                    stat.color === 'blue' && 'text-blue-500',
                    stat.color === 'amber' && 'text-amber-500',
                    stat.color === 'pink' && 'text-pink-500',
                    stat.color === 'cyan' && 'text-cyan-500',
                  )} />
                </div>
                <div>
                  <p className={cn(
                    'text-xs',
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  )}>
                    {stat.label}
                  </p>
                  <p className={cn(
                    'text-xl font-bold',
                    isDark ? 'text-white' : 'text-slate-900'
                  )}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Averages */}
      <div className={cn(
        'rounded-xl border p-6',
        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
      )}>
        <h3 className={cn(
          'font-semibold mb-4',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          Platform-Wide Averages
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {performanceStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className={cn(
                'text-2xl font-bold',
                stat.color === 'violet' && 'text-violet-500',
                stat.color === 'emerald' && 'text-emerald-500',
                stat.color === 'blue' && 'text-blue-500',
                stat.color === 'amber' && 'text-amber-500',
                stat.color === 'pink' && 'text-pink-500',
                stat.color === 'cyan' && 'text-cyan-500',
              )}>
                {stat.value}
              </p>
              <p className={cn(
                'text-xs mt-1',
                isDark ? 'text-slate-400' : 'text-slate-500'
              )}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className={cn(
          'rounded-xl border p-6',
          isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
        )}>
          <h3 className={cn(
            'font-semibold mb-4',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            Account Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#fff',
                    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tier Distribution */}
        <div className={cn(
          'rounded-xl border p-6',
          isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
        )}>
          <h3 className={cn(
            'font-semibold mb-4',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            Subscription Tier Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#fff',
                    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string, entry: any) => [
                    `${value} accounts (${formatCurrency(entry.payload.mrr)}/mo)`,
                    name
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className={cn(
        'rounded-xl border p-6',
        isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
      )}>
        <h3 className={cn(
          'font-semibold mb-4',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          Geographic Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {analytics.countryDistribution.slice(0, 12).map((item) => (
            <div
              key={item.country}
              className={cn(
                'rounded-lg border p-3 text-center',
                isDark ? 'bg-slate-700/30 border-slate-600/50' : 'bg-slate-50 border-slate-200'
              )}
            >
              <p className={cn(
                'text-lg font-bold',
                isDark ? 'text-white' : 'text-slate-900'
              )}>
                {item.count}
              </p>
              <p className={cn(
                'text-xs truncate',
                isDark ? 'text-slate-400' : 'text-slate-500'
              )}>
                {item.country}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
