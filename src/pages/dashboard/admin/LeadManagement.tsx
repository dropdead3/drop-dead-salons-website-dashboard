import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, ArrowLeft } from 'lucide-react';
import { LeadFunnelCard } from '@/components/dashboard/LeadFunnelCard';
import { LeadInbox } from '@/components/dashboard/LeadInbox';
import { LeadSlaSettings } from '@/components/dashboard/leads/LeadSlaSettings';
import { useActiveLocations } from '@/hooks/useLocations';

export default function LeadManagement() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | '3months'>('month');
  const { data: locations = [] } = useActiveLocations();
  
  const locationFilter = selectedLocation === 'all' ? undefined : selectedLocation;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header with filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
              <Link to="/dashboard/admin/management">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-3xl lg:text-4xl mb-2">LEAD MANAGEMENT</h1>
              <p className="text-muted-foreground font-sans">
                Track, assign, and convert salon inquiries from all sources.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Location filter */}
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[180px]">
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Date range tabs */}
            <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="3months">3 Months</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Lead Funnel Analytics + SLA Settings */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <LeadFunnelCard 
              locationId={locationFilter}
              dateRange={dateRange}
            />
          </div>
          <LeadSlaSettings />
        </div>

        {/* Lead Inbox */}
        <div className="mb-6">
          <LeadInbox />
        </div>
      </div>
    </DashboardLayout>
  );
}
