import { useRentRevenueAnalytics } from '@/hooks/useRentRevenueAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, DollarSign, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

// TODO: Get from organization context when available
const DEFAULT_ORG_ID = 'drop-dead-salons';

const statusColors: Record<string, string> = {
  current: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function RentRevenueAnalytics() {
  const { data: metrics, isLoading } = useRentRevenueAnalytics(DEFAULT_ORG_ID);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading rent analytics...</div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No rent data available. Add booth renters and contracts to see analytics.
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Monthly Revenue</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(metrics.monthlyRentRevenue)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">YTD Revenue</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.yearlyRentRevenue)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Store className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Collection Rate</span>
            </div>
            <p className={`text-2xl font-bold ${metrics.collectionRate >= 95 ? 'text-emerald-400' : metrics.collectionRate >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
              {metrics.collectionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {formatCurrency(metrics.overdueBalance)}
            </p>
            {metrics.overdueRenterCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{metrics.overdueRenterCount} renter{metrics.overdueRenterCount !== 1 ? 's' : ''}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Active Renters</span>
            </div>
            <p className="text-2xl font-bold">{metrics.activeRenterCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      {metrics.monthlyTrend.length > 0 && (
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">Rent Collection Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Line
                    type="monotone"
                    dataKey="collected"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    name="Collected"
                  />
                  <Line
                    type="monotone"
                    dataKey="due"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Due"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Renter Breakdown Table */}
      {metrics.renterBreakdown.length > 0 && (
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">Renter Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Renter</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Monthly Rent</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">YTD Collected</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Outstanding</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.renterBreakdown.map((renter, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-card/70">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{renter.renter_name}</p>
                          {renter.business_name && (
                            <p className="text-sm text-muted-foreground">{renter.business_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium">{formatCurrency(renter.monthly_rent)}</td>
                      <td className="p-4 text-right text-emerald-400">{formatCurrency(renter.collected_ytd)}</td>
                      <td className="p-4 text-right">
                        {renter.outstanding > 0 ? (
                          <span className="text-red-400">{formatCurrency(renter.outstanding)}</span>
                        ) : (
                          <span className="text-emerald-400">$0</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <Badge variant="outline" className={statusColors[renter.status]}>
                            {renter.status}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
