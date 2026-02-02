import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePhorestPerformanceMetrics, usePhorestConnection, useUserPhorestMapping } from '@/hooks/usePhorestSync';
import { useUserSalesSummary } from '@/hooks/useSalesData';
import { format, startOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { 
  TrendingUp,
  Link2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { PhorestSyncButton } from '@/components/dashboard/PhorestSyncButton';
import { PersonalGoalsCard } from '@/components/dashboard/sales/PersonalGoalsCard';
import { TierProgressAlert } from '@/components/dashboard/sales/TierProgressAlert';
import { SalesAchievements } from '@/components/dashboard/sales/SalesAchievements';
import { PerformanceTrendChart } from '@/components/dashboard/sales/PerformanceTrendChart';
import { ClientInsightsCard } from '@/components/dashboard/sales/ClientInsightsCard';
import { ServiceMixChart } from '@/components/dashboard/sales/ServiceMixChart';
import { StylistLocationRevenueChart } from '@/components/dashboard/sales/StylistLocationRevenueChart';

export default function Stats() {
  const { user } = useAuth();
  const [clientInsightsLocation, setClientInsightsLocation] = useState<string>('all');

  // Date ranges for sales data
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

  // Phorest data
  const { data: phorestConnection } = usePhorestConnection();
  const { data: phorestMetrics } = usePhorestPerformanceMetrics(weekStart);
  const { data: userPhorestMapping } = useUserPhorestMapping(user?.id);

  // User sales data for goals and achievements
  const { data: userWeeklySales } = useUserSalesSummary(user?.id, weekStart, format(today, 'yyyy-MM-dd'));
  const { data: userMonthlySales } = useUserSalesSummary(user?.id, monthStart, monthEnd);

  // Find current user's Phorest metrics
  const myPhorestMetrics = useMemo(() => {
    if (!phorestMetrics || !user) return null;
    return phorestMetrics.find((m: any) => m.user_id === user.id);
  }, [phorestMetrics, user]);
  
  // Check if user is linked to Phorest (has active mapping)
  const isLinkedToPhorest = !!userPhorestMapping;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl mb-2">
              MY STATS
            </h1>
            <p className="text-muted-foreground font-sans">
              Track your personal performance metrics.
            </p>
          </div>
        </div>

        {/* Performance Content */}
        <div className="space-y-6">
            {myPhorestMetrics && (
              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" />
                    <h2 className="font-display text-sm tracking-wide">PHOREST DATA - THIS WEEK</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhorestSyncButton syncType="reports" size="sm" />
                    <Badge variant="outline" className="text-primary border-primary">
                      <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
                      Live
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center">
                    <p className="text-2xl font-display">{myPhorestMetrics.new_clients}</p>
                    <p className="text-xs text-muted-foreground">New Clients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-display">${Number(myPhorestMetrics.total_revenue).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-display">{myPhorestMetrics.service_count}</p>
                    <p className="text-xs text-muted-foreground">Services</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-display">{Number(myPhorestMetrics.retention_rate).toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Retention</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Show connection prompt if not linked to Phorest */}
            {!isLinkedToPhorest && phorestConnection?.connected && (
              <Card className="p-4 bg-muted/50 border-dashed">
                <p className="text-sm text-muted-foreground text-center">
                  Your account isn't linked to Phorest yet. <Link to="/dashboard/admin/phorest" className="text-primary underline">Set up staff mapping</Link> to see your stats automatically.
                </p>
              </Card>
            )}

            {/* Personal Goals & Progress Section */}
            {user && (
              <div className="grid gap-6 md:grid-cols-2">
                <PersonalGoalsCard 
                  userId={user.id}
                  currentMonthlyRevenue={userMonthlySales?.totalRevenue || 0}
                  currentWeeklyRevenue={userWeeklySales?.totalRevenue || 0}
                />
                <TierProgressAlert 
                  currentRevenue={userMonthlySales?.totalRevenue || 0}
                />
              </div>
            )}

            {/* Performance Visualizations */}
            {user && isLinkedToPhorest && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <PerformanceTrendChart userId={user.id} weeks={8} />
                </div>
                <ClientInsightsCard 
                  userId={user.id} 
                  locationId={clientInsightsLocation}
                  onLocationChange={setClientInsightsLocation}
                  showLocationFilter={true}
                />
              </div>
            )}

            {/* Location Revenue Comparison - for multi-branch stylists */}
            {user && isLinkedToPhorest && (
              <StylistLocationRevenueChart userId={user.id} months={3} />
            )}

            {/* Service Mix */}
            {user && isLinkedToPhorest && (
              <div className="grid gap-6 md:grid-cols-2">
                <ServiceMixChart userId={user.id} days={30} />
                <SalesAchievements
                  totalRevenue={userMonthlySales?.totalRevenue || 0}
                  serviceRevenue={userMonthlySales?.serviceRevenue || 0}
                  productRevenue={userMonthlySales?.productRevenue || 0}
                  totalTransactions={userMonthlySales?.totalTransactions || 0}
                />
              </div>
            )}

            {/* Fallback for non-Phorest users */}
            {user && !isLinkedToPhorest && (userMonthlySales?.totalRevenue || 0) > 0 && (
              <SalesAchievements
                totalRevenue={userMonthlySales?.totalRevenue || 0}
                serviceRevenue={userMonthlySales?.serviceRevenue || 0}
                productRevenue={userMonthlySales?.productRevenue || 0}
                totalTransactions={userMonthlySales?.totalTransactions || 0}
              />
            )}

            {/* Conversion Dashboard - Powered by Phorest */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-sm tracking-wide">CONVERSION DASHBOARD</h2>
                </div>
                {isLinkedToPhorest && (
                  <Badge variant="outline" className="text-xs">
                    <Link2 className="w-3 h-3 mr-1" />
                    Phorest Data
                  </Badge>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Rebooking Rate"
                  value={myPhorestMetrics?.rebooking_rate 
                    ? `${Number(myPhorestMetrics.rebooking_rate).toFixed(0)}%` 
                    : '0%'
                  }
                />
                <StatCard
                  label="Retention Rate"
                  value={myPhorestMetrics?.retention_rate 
                    ? `${Number(myPhorestMetrics.retention_rate).toFixed(0)}%` 
                    : '0%'
                  }
                />
                <StatCard
                  label="Avg Ticket Value"
                  value={myPhorestMetrics?.average_ticket 
                    ? `$${Number(myPhorestMetrics.average_ticket).toLocaleString()}` 
                    : (userWeeklySales?.averageTicket 
                      ? `$${userWeeklySales.averageTicket.toLocaleString()}` 
                      : '$0')
                  }
                />
                <StatCard
                  label="New Clients"
                  value={myPhorestMetrics?.new_clients?.toString() || '0'}
                />
              </div>
              {!isLinkedToPhorest && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Link your Phorest account to see live conversion metrics
                </p>
              )}
            </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4 text-center">
      <p className="text-xs text-muted-foreground font-display tracking-wide mb-2">
        {label}
      </p>
      <p className="font-display text-2xl">{value}</p>
    </Card>
  );
}
