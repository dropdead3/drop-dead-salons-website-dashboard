import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  MapPin,
  BarChart3,
  ClipboardCheck
} from 'lucide-react';
import { useStaffUtilization } from '@/hooks/useStaffUtilization';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

import type { StaffDateRange } from '@/hooks/useStaffUtilization';

interface StaffUtilizationContentProps {
  locationId?: string;
  dateRange: StaffDateRange;
}

export function StaffUtilizationContent({ locationId, dateRange }: StaffUtilizationContentProps) {
  const { workload, qualifications, locationDistribution, isLoading } = useStaffUtilization(
    locationId,
    dateRange
  );

  // Summary stats
  const totalAppointments = workload.reduce((sum, s) => sum + s.appointmentCount, 0);
  const totalCompleted = workload.reduce((sum, s) => sum + s.completedCount, 0);
  const totalNoShows = workload.reduce((sum, s) => sum + s.noShowCount, 0);
  const avgPerStylist = workload.length > 0 ? Math.round(totalAppointments / workload.length) : 0;

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-2xl">{totalAppointments}</p>
              <p className="text-xs text-muted-foreground">Total Appointments</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-display text-2xl">{totalCompleted}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-display text-2xl">{totalNoShows}</p>
              <p className="text-xs text-muted-foreground">No Shows</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-display text-2xl">{avgPerStylist}</p>
              <p className="text-xs text-muted-foreground">Avg Per Stylist</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Workload Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Appointment Count by Stylist
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : workload.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No appointment data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workload.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="displayName" 
                    width={100}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value, index) => workload[index]?.displayName || workload[index]?.name?.split(' ')[0] || value}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        appointmentCount: 'Total',
                        completedCount: 'Completed',
                        noShowCount: 'No Shows'
                      };
                      return [value, labels[name] || name];
                    }}
                  />
                  <Bar dataKey="completedCount" stackId="a" fill="hsl(var(--chart-2))" name="completedCount" />
                  <Bar dataKey="noShowCount" stackId="a" fill="hsl(var(--destructive))" name="noShowCount" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : locationDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                No location data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={locationDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="appointmentCount"
                    nameKey="locationName"
                  >
                    {locationDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Appointments']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff Workload List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Workload Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : workload.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No staff data available
            </div>
          ) : (
            <div className="space-y-4">
              {workload.map(staff => (
                <div key={staff.userId} className="flex items-center gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={staff.photoUrl || undefined} />
                    <AvatarFallback>
                      {(staff.displayName || staff.name).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">
                        {staff.displayName || staff.name}
                      </span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">
                          {staff.appointmentCount} appts
                        </span>
                        <span className="text-green-600">
                          {staff.completedCount} completed
                        </span>
                        {staff.noShowCount > 0 && (
                          <span className="text-red-600">
                            {staff.noShowCount} no-shows
                          </span>
                        )}
                      </div>
                    </div>
                    <Progress value={staff.utilizationScore} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Qualifications Matrix */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Service Qualifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : qualifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No service qualification data available</p>
              <p className="text-sm mt-1">Sync staff services from Phorest to populate this data.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {qualifications.map(staff => (
                <div key={staff.userId} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <p className="font-medium mb-2">{staff.staffName}</p>
                  <div className="flex flex-wrap gap-1">
                    {staff.serviceCategories.map(category => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  {staff.qualifiedServices.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      +{staff.qualifiedServices.length - 5} more services
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
