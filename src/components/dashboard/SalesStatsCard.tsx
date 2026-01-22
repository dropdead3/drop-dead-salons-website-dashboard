import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Scissors, ShoppingBag, TrendingUp, Receipt } from 'lucide-react';
import { useUserSalesSummary } from '@/hooks/useSalesData';
import { useUserPhorestMapping } from '@/hooks/usePhorestSync';
import { format, subDays, startOfWeek } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PhorestSyncButton } from './PhorestSyncButton';

interface SalesStatsCardProps {
  userId: string | undefined;
}

type DateRange = '7d' | '30d' | 'thisWeek';

export function SalesStatsCard({ userId }: SalesStatsCardProps) {
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  // Calculate date filters
  const dateFilters = (() => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return { dateFrom: format(subDays(now, 7), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
      case '30d':
        return { dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
      case 'thisWeek':
        return { 
          dateFrom: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), 
          dateTo: format(now, 'yyyy-MM-dd') 
        };
      default:
        return { dateFrom: format(subDays(now, 7), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
    }
  })();

  const { data, isLoading } = useUserSalesSummary(userId, dateFilters.dateFrom, dateFilters.dateTo);
  const { data: userMapping, isLoading: mappingLoading } = useUserPhorestMapping(userId);

  if (isLoading || mappingLoading) {
    return (
      <Card className="p-6 bg-chart-2/5 border-chart-2/20 mb-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-8 w-20 mx-auto mb-1" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // User not linked to Phorest - don't show anything (the Stats page shows linking prompt)
  if (!userMapping) {
    return null;
  }

  // User is linked but no data yet
  if (!data) {
    return (
      <Card className="p-4 bg-muted/50 border-dashed mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground text-center">
            No sales data available yet.
          </p>
          <PhorestSyncButton syncType="sales" />
        </div>
      </Card>
    );
  }

  const getRangeLabel = () => {
    switch (dateRange) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case 'thisWeek': return 'This Week';
    }
  };

  return (
    <Card className="p-6 bg-chart-2/5 border-chart-2/20 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-chart-2" />
          <h2 className="font-display text-sm tracking-wide">MY SALES DATA</h2>
        </div>
        <div className="flex items-center gap-2">
          <PhorestSyncButton syncType="sales" size="sm" />
          <Select value={dateRange} onValueChange={(v: DateRange) => setDateRange(v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-chart-2 border-chart-2">
            {data.daysWithData} days
          </Badge>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-4 h-4 text-chart-2" />
            <p className="text-2xl font-display">${data.totalRevenue.toLocaleString()}</p>
          </div>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Scissors className="w-4 h-4 text-chart-3" />
            <p className="text-2xl font-display">${data.serviceRevenue.toLocaleString()}</p>
          </div>
          <p className="text-xs text-muted-foreground">Services</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ShoppingBag className="w-4 h-4 text-chart-4" />
            <p className="text-2xl font-display">${data.productRevenue.toLocaleString()}</p>
          </div>
          <p className="text-xs text-muted-foreground">Products</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Receipt className="w-4 h-4 text-chart-5" />
            <p className="text-2xl font-display">{data.totalTransactions}</p>
          </div>
          <p className="text-xs text-muted-foreground">Transactions</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-2xl font-display">${Math.round(data.averageTicket)}</p>
          </div>
          <p className="text-xs text-muted-foreground">Avg Ticket</p>
        </div>
      </div>
    </Card>
  );
}
