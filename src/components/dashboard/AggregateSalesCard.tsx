import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  Scissors, 
  ShoppingBag, 
  TrendingUp, 
  Receipt,
  MapPin,
  Building2
} from 'lucide-react';
import { useSalesMetrics, useSalesByLocation } from '@/hooks/useSalesData';
import { format, subDays, startOfWeek } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { PhorestSyncButton } from './PhorestSyncButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type DateRange = '7d' | '30d' | 'thisWeek';

export function AggregateSalesCard() {
  const [dateRange, setDateRange] = useState<DateRange>('7d');

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

  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics(dateFilters);
  const { data: locationData, isLoading: locationLoading } = useSalesByLocation(dateFilters.dateFrom, dateFilters.dateTo);

  const isLoading = metricsLoading || locationLoading;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-5 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-8 w-20 mx-auto mb-1" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  const displayMetrics = metrics || {
    totalRevenue: 0,
    serviceRevenue: 0,
    productRevenue: 0,
    totalTransactions: 0,
    averageTicket: 0,
  };

  const hasNoData = !metrics || displayMetrics.totalRevenue === 0;

  const getRangeLabel = () => {
    switch (dateRange) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case 'thisWeek': return 'This Week';
    }
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center rounded-lg">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-display text-sm tracking-wide">SALES OVERVIEW</h2>
            <p className="text-xs text-muted-foreground">All locations combined</p>
          </div>
          {hasNoData && (
            <Badge variant="outline" className="text-muted-foreground">
              No data yet
            </Badge>
          )}
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
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-8">
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <p className="text-2xl font-display">${displayMetrics.totalRevenue.toLocaleString()}</p>
          </div>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Scissors className="w-4 h-4 text-blue-600" />
            <p className="text-2xl font-display">${displayMetrics.serviceRevenue.toLocaleString()}</p>
          </div>
          <p className="text-xs text-muted-foreground">Services</p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            <p className="text-2xl font-display">${displayMetrics.productRevenue.toLocaleString()}</p>
          </div>
          <p className="text-xs text-muted-foreground">Products</p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Receipt className="w-4 h-4 text-orange-600" />
            <p className="text-2xl font-display">{displayMetrics.totalTransactions}</p>
          </div>
          <p className="text-xs text-muted-foreground">Transactions</p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-2xl font-display">
              ${isFinite(displayMetrics.averageTicket) ? Math.round(displayMetrics.averageTicket) : 0}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Avg Ticket</p>
        </div>
      </div>

      {/* By Location Table */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-display text-xs tracking-wide text-muted-foreground">BY LOCATION</h3>
        </div>
        
        {locationData && locationData.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-display text-xs">Location</TableHead>
                  <TableHead className="font-display text-xs text-right">Revenue</TableHead>
                  <TableHead className="font-display text-xs text-right hidden sm:table-cell">Services</TableHead>
                  <TableHead className="font-display text-xs text-right hidden sm:table-cell">Products</TableHead>
                  <TableHead className="font-display text-xs text-right hidden md:table-cell">Transactions</TableHead>
                  <TableHead className="font-display text-xs text-right">Avg Ticket</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationData.map((location, idx) => {
                  const avgTicket = location.totalTransactions > 0 
                    ? location.totalRevenue / location.totalTransactions 
                    : 0;
                  return (
                    <TableRow key={location.location_id || idx}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{location.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-display">
                        ${location.totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        ${location.serviceRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        ${location.productRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        {location.totalTransactions}
                      </TableCell>
                      <TableCell className="text-right font-display">
                        ${isFinite(avgTicket) ? Math.round(avgTicket) : 0}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No location data available</p>
            <p className="text-xs mt-1">Sync sales to see breakdown by location</p>
          </div>
        )}
      </div>
    </Card>
  );
}
