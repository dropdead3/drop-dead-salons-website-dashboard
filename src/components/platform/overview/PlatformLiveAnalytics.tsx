import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  DollarSign,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface MonthlyData {
  month: string;
  accounts: number;
  locations: number;
}

function usePlatformGrowthData() {
  return useQuery({
    queryKey: ['platform-growth-analytics'],
    queryFn: async () => {
      // Get account creation data for last 6 months
      const months: MonthlyData[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        
        const { count: accountCount } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', monthEnd.toISOString());
        
        const { count: locationCount } = await supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', monthEnd.toISOString());
        
        months.push({
          month: format(date, 'MMM'),
          accounts: accountCount || 0,
          locations: locationCount || 0,
        });
      }
      
      // Calculate growth rates
      const currentMonth = months[months.length - 1];
      const previousMonth = months[months.length - 2];
      
      const accountGrowth = previousMonth.accounts > 0 
        ? ((currentMonth.accounts - previousMonth.accounts) / previousMonth.accounts) * 100 
        : 0;
      
      const locationGrowth = previousMonth.locations > 0
        ? ((currentMonth.locations - previousMonth.locations) / previousMonth.locations) * 100
        : 0;
      
      return {
        months,
        currentAccounts: currentMonth.accounts,
        currentLocations: currentMonth.locations,
        accountGrowth,
        locationGrowth,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

interface PlatformLiveAnalyticsProps {
  className?: string;
}

export function PlatformLiveAnalytics({ className }: PlatformLiveAnalyticsProps) {
  const { data, isLoading } = usePlatformGrowthData();

  if (isLoading) {
    return (
      <div className={cn("rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-6", className)}>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-violet-500/20">
            <Activity className="h-4 w-4 text-violet-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Platform Growth</h2>
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl bg-slate-700/50" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Skeleton className="h-20 rounded-xl bg-slate-700/50" />
          <Skeleton className="h-20 rounded-xl bg-slate-700/50" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-6", className)}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/20">
            <Activity className="h-4 w-4 text-violet-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Platform Growth</h2>
        </div>
        <span className="text-xs text-slate-500">Last 6 months</span>
      </div>

      {/* Chart */}
      <div className="h-[180px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data?.months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAccounts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLocations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '12px',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
              }}
              labelStyle={{ color: '#e2e8f0', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="accounts"
              name="Accounts"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAccounts)"
            />
            <Area
              type="monotone"
              dataKey="locations"
              name="Locations"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLocations)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <MetricCard
          label="Total Accounts"
          value={data?.currentAccounts || 0}
          change={data?.accountGrowth || 0}
          icon={Building2}
          color="violet"
        />
        <MetricCard
          label="Total Locations"
          value={data?.currentLocations || 0}
          change={data?.locationGrowth || 0}
          icon={Users}
          color="emerald"
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'violet' | 'emerald' | 'amber';
}

function MetricCard({ label, value, change, icon: Icon, color }: MetricCardProps) {
  const isPositive = change >= 0;
  
  const colorStyles = {
    violet: 'bg-violet-500/10 text-violet-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };

  return (
    <div className="rounded-xl bg-slate-700/30 border border-slate-600/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-1.5 rounded-lg", colorStyles[color])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        {change !== 0 && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            isPositive ? "text-emerald-400" : "text-rose-400"
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
