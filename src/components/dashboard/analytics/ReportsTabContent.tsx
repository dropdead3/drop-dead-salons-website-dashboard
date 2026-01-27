import { useState } from 'react';
import { format } from 'date-fns';
import { Tabs, TabsContent, SubTabsList, SubTabsTrigger } from '@/components/ui/tabs';
import { VisibilityGate } from '@/components/visibility/VisibilityGate';
import { 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp,
  Clock,
  BarChart3,
  UserCheck,
  Building2,
  CalendarDays
} from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { ReportCard } from '@/components/dashboard/reports/ReportCard';
import { RecentReports } from '@/components/dashboard/reports/RecentReports';
import { SalesReportGenerator } from '@/components/dashboard/reports/SalesReportGenerator';
import { StaffKPIReport } from '@/components/dashboard/reports/StaffKPIReport';
import { ClientRetentionReport } from '@/components/dashboard/reports/ClientRetentionReport';
import { NoShowReport } from '@/components/dashboard/reports/NoShowReport';
import { CapacityReport } from '@/components/dashboard/reports/CapacityReport';
import type { AnalyticsFilters } from '@/pages/dashboard/admin/AnalyticsHub';

const reportCategories = [
  { id: 'sales', label: 'Sales', icon: DollarSign },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'clients', label: 'Clients', icon: UserCheck },
  { id: 'operations', label: 'Operations', icon: Clock },
  { id: 'financial', label: 'Financial', icon: TrendingUp },
];

const salesReports = [
  { id: 'daily-sales', name: 'Daily Sales Summary', description: 'Revenue by day with service/product split', icon: BarChart3 },
  { id: 'stylist-sales', name: 'Sales by Stylist', description: 'Individual performance rankings', icon: Users },
  { id: 'location-sales', name: 'Sales by Location', description: 'Multi-location comparison', icon: Building2 },
  { id: 'product-sales', name: 'Product Sales Report', description: 'Top products and attachment rates', icon: DollarSign },
];

const staffReports = [
  { id: 'staff-kpi', name: 'Staff KPI Report', description: 'Comprehensive staff performance metrics', icon: BarChart3 },
  { id: 'productivity', name: 'Productivity Report', description: 'Hours worked vs revenue generated', icon: Clock },
  { id: 'rebooking', name: 'Rebooking Analysis', description: 'Staff rebooking rates and trends', icon: UserCheck },
  { id: 'new-clients', name: 'New Client Acquisition', description: "Who's bringing in new clients", icon: UserCheck },
];

const clientReports = [
  { id: 'retention', name: 'Client Retention Report', description: 'Return rates and at-risk clients', icon: UserCheck },
  { id: 'lifetime-value', name: 'Client Lifetime Value', description: 'Top spenders and average LTV', icon: DollarSign },
  { id: 'new-vs-returning', name: 'New vs Returning', description: 'Acquisition funnel analysis', icon: TrendingUp },
  { id: 'visit-frequency', name: 'Visit Frequency', description: 'Visit patterns by segment', icon: CalendarDays },
];

const operationsReports = [
  { id: 'capacity', name: 'Capacity Utilization', description: 'Booking density and peak hours', icon: BarChart3 },
  { id: 'no-show', name: 'No-Show Report', description: 'No-show rates by staff, day, time', icon: Clock },
  { id: 'service-duration', name: 'Service Duration', description: 'Actual vs expected times', icon: Clock },
  { id: 'lead-time', name: 'Appointment Lead Time', description: 'How far ahead clients book', icon: CalendarDays },
];

const financialReports = [
  { id: 'revenue-trend', name: 'Revenue Trend', description: 'Daily/weekly/monthly trends', icon: TrendingUp },
  { id: 'commission', name: 'Commission Report', description: 'Staff earnings calculations', icon: DollarSign },
  { id: 'goals', name: 'Goal Progress', description: 'Team and individual goal tracking', icon: BarChart3 },
  { id: 'yoy', name: 'Year-over-Year', description: 'Historical performance comparison', icon: TrendingUp },
];

interface ReportsTabContentProps {
  filters: AnalyticsFilters;
}

export function ReportsTabContent({ filters }: ReportsTabContentProps) {
  const [activeCategory, setActiveCategory] = useState('sales');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const handleReportSelect = (reportId: string) => {
    setSelectedReport(reportId);
  };

  const handleCloseReport = () => {
    setSelectedReport(null);
  };

  const renderReportCards = (reports: typeof salesReports) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          id={report.id}
          name={report.name}
          description={report.description}
          icon={report.icon}
          onSelect={handleReportSelect}
        />
      ))}
    </div>
  );

  const renderSelectedReport = () => {
    const location = filters.locationId === 'all' ? undefined : filters.locationId;

    switch (selectedReport) {
      case 'daily-sales':
      case 'stylist-sales':
      case 'location-sales':
      case 'product-sales':
        return (
          <SalesReportGenerator
            reportType={selectedReport}
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            locationId={location}
            onClose={handleCloseReport}
          />
        );
      case 'staff-kpi':
      case 'productivity':
      case 'rebooking':
      case 'new-clients':
        return (
          <StaffKPIReport
            reportType={selectedReport}
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            locationId={location}
            onClose={handleCloseReport}
          />
        );
      case 'retention':
      case 'lifetime-value':
      case 'new-vs-returning':
      case 'visit-frequency':
        return (
          <ClientRetentionReport
            reportType={selectedReport}
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            locationId={location}
            onClose={handleCloseReport}
          />
        );
      case 'no-show':
      case 'service-duration':
      case 'lead-time':
        return (
          <NoShowReport
            reportType={selectedReport}
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            locationId={location}
            onClose={handleCloseReport}
          />
        );
      case 'capacity':
        return (
          <CapacityReport
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            locationId={location}
            onClose={handleCloseReport}
          />
        );
      default:
        return null;
    }
  };

  if (selectedReport) {
    return (
      <div className="space-y-4">
        <button 
          onClick={handleCloseReport}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Back to Reports
        </button>
        {renderSelectedReport()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Label + Sub-tabs */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Report Category
        </span>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <SubTabsList>
            {reportCategories.map((cat) => (
              <VisibilityGate 
                key={cat.id}
                elementKey={`reports_${cat.id}_subtab`} 
                elementName={`${cat.label} Reports`} 
                elementCategory="Page Tabs"
              >
                <SubTabsTrigger value={cat.id}>
                  <cat.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </SubTabsTrigger>
              </VisibilityGate>
            ))}
          </SubTabsList>

        <TabsContent value="sales" className="mt-6">
          {renderReportCards(salesReports)}
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          {renderReportCards(staffReports)}
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          {renderReportCards(clientReports)}
        </TabsContent>

        <TabsContent value="operations" className="mt-6">
          {renderReportCards(operationsReports)}
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          {renderReportCards(financialReports)}
        </TabsContent>
        </Tabs>
      </div>

      {/* Recent Reports */}
      <RecentReports />
    </div>
  );
}
