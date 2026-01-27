import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VisibilityGate } from '@/components/visibility/VisibilityGate';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  DollarSign, 
  BarChart3, 
  TrendingUp, 
  Target, 
  FileText,
  MapPin,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserLocationAccess } from '@/hooks/useUserLocationAccess';

// Tab content components
import { SalesTabContent } from '@/components/dashboard/analytics/SalesTabContent';
import { OperationsTabContent } from '@/components/dashboard/analytics/OperationsTabContent';
import { MarketingTabContent } from '@/components/dashboard/analytics/MarketingTabContent';
import { ProgramTabContent } from '@/components/dashboard/analytics/ProgramTabContent';
import { ReportsTabContent } from '@/components/dashboard/analytics/ReportsTabContent';

const analyticsCategories = [
  { id: 'sales', label: 'Sales', icon: DollarSign },
  { id: 'operations', label: 'Operations', icon: BarChart3 },
  { id: 'marketing', label: 'Marketing', icon: TrendingUp },
  { id: 'program', label: 'Program', icon: Target },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export type DateRangeType = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom';

export interface AnalyticsFilters {
  locationId: string;
  dateRange: DateRangeType;
  dateFrom: string;
  dateTo: string;
}

export default function AnalyticsHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'sales';
  const subTab = searchParams.get('subtab') || undefined;
  
  // Location access control
  const { 
    accessibleLocations, 
    canViewAggregate, 
    defaultLocationId,
    isLoading: locationAccessLoading 
  } = useUserLocationAccess();
  
  const [locationId, setLocationId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRangeType>('30d');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  // Set default location when access data loads
  useEffect(() => {
    if (!locationAccessLoading && !locationId) {
      setLocationId(defaultLocationId);
    }
  }, [locationAccessLoading, defaultLocationId, locationId]);
  
  // Determine if we should show the location selector
  const showLocationSelector = canViewAggregate || accessibleLocations.length > 1;

  // Calculate date filters based on selected range
  const dateFilters = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { dateFrom: format(now, 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { dateFrom: format(yesterday, 'yyyy-MM-dd'), dateTo: format(yesterday, 'yyyy-MM-dd') };
      case '7d':
        return { dateFrom: format(subDays(now, 7), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
      case '30d':
        return { dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
      case '90d':
        return { dateFrom: format(subDays(now, 90), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
      case 'thisWeek':
        return { 
          dateFrom: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), 
          dateTo: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd') 
        };
      case 'thisMonth':
        return { 
          dateFrom: format(startOfMonth(now), 'yyyy-MM-dd'), 
          dateTo: format(endOfMonth(now), 'yyyy-MM-dd') 
        };
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        return { 
          dateFrom: format(startOfMonth(lastMonth), 'yyyy-MM-dd'), 
          dateTo: format(endOfMonth(lastMonth), 'yyyy-MM-dd') 
        };
      case 'custom':
        return {
          dateFrom: format(customDateRange.from, 'yyyy-MM-dd'),
          dateTo: format(customDateRange.to, 'yyyy-MM-dd'),
        };
      default:
        return { dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
    }
  }, [dateRange, customDateRange]);

  const filters: AnalyticsFilters = {
    locationId,
    dateRange,
    ...dateFilters,
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleSubTabChange = (value: string) => {
    setSearchParams({ tab: activeTab, subtab: value });
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-display">ANALYTICS & REPORTS</h1>
            <p className="text-muted-foreground text-sm">Business intelligence and data exports</p>
          </div>
          
          {/* Shared Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Location Filter - conditionally rendered based on access */}
            {showLocationSelector && (
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="w-[180px]">
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {canViewAggregate && (
                    <SelectItem value="all">All Locations</SelectItem>
                  )}
                  {accessibleLocations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Single location badge (when only one location assigned) */}
            {!showLocationSelector && accessibleLocations.length === 1 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm h-9">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{accessibleLocations[0].name}</span>
              </div>
            )}

            {/* Date Range Select */}
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeType)}>
              <SelectTrigger className="w-[150px]">
                <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Date Picker (only when custom is selected) */}
            {dateRange === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="min-w-[200px] justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(customDateRange.from, 'MMM d')} - {format(customDateRange.to, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomDateRange({
                          from: startOfMonth(new Date()),
                          to: endOfMonth(new Date()),
                        })}
                      >
                        This Month
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomDateRange({
                          from: startOfMonth(subMonths(new Date(), 1)),
                          to: endOfMonth(subMonths(new Date(), 1)),
                        })}
                      >
                        Last Month
                      </Button>
                    </div>
                    <Calendar
                      mode="range"
                      selected={{ from: customDateRange.from, to: customDateRange.to }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setCustomDateRange({ from: range.from, to: range.to });
                        }
                      }}
                      numberOfMonths={2}
                      className="pointer-events-auto"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Main Tab Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full md:w-auto flex-wrap h-auto gap-1 p-1">
            {analyticsCategories.map((cat) => (
              <VisibilityGate 
                key={cat.id}
                elementKey={`analytics_${cat.id}_tab`} 
                elementName={cat.label} 
                elementCategory="Page Tabs"
              >
                <TabsTrigger 
                  value={cat.id} 
                  className="gap-2 data-[state=active]:bg-background"
                >
                  <cat.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              </VisibilityGate>
            ))}
          </TabsList>

          <TabsContent value="sales" className="mt-6">
            <SalesTabContent 
              filters={filters} 
              subTab={subTab}
              onSubTabChange={handleSubTabChange}
            />
          </TabsContent>

          <TabsContent value="operations" className="mt-6">
            <OperationsTabContent 
              filters={filters}
              subTab={subTab}
              onSubTabChange={handleSubTabChange}
            />
          </TabsContent>

          <TabsContent value="marketing" className="mt-6">
            <MarketingTabContent filters={filters} />
          </TabsContent>

          <TabsContent value="program" className="mt-6">
            <ProgramTabContent filters={filters} />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsTabContent filters={filters} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
