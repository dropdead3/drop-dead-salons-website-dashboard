import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Users, 
  MapPin, 
  Upload, 
  Plus, 
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';
import { formatDistanceToNow } from 'date-fns';

export default function PlatformOverview() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useOrganizationStats();

  if (isLoading) {
    return <PlatformOverviewSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground">
            Manage salon accounts, migrations, and platform health
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/platform/accounts')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Salon Account
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Salons"
          value={stats?.totalOrganizations || 0}
          icon={Building2}
          description="Active salon accounts"
        />
        <StatCard
          title="In Onboarding"
          value={stats?.onboardingOrganizations || 0}
          icon={Clock}
          description="Salons being set up"
          variant="warning"
        />
        <StatCard
          title="Pending Migrations"
          value={stats?.pendingMigrations || 0}
          icon={Upload}
          description="Data imports in progress"
          variant={stats?.pendingMigrations ? 'warning' : 'default'}
        />
        <StatCard
          title="Total Locations"
          value={stats?.totalLocations || 0}
          icon={MapPin}
          description="Across all salons"
        />
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => navigate('/dashboard/platform/accounts')}
            >
              <Building2 className="h-4 w-4" />
              View All Accounts
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => navigate('/dashboard/platform/import')}
            >
              <Upload className="h-4 w-4" />
              Start Migration
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => navigate('/dashboard/platform/settings')}
            >
              <Users className="h-4 w-4" />
              Platform Settings
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/platform/accounts')}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Create your first salon account to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  variant?: 'default' | 'warning' | 'success';
}

function StatCard({ title, value, icon: Icon, description, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-card',
    warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    success: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    description: string;
    organizationName?: string;
    createdAt: string;
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  const iconMap: Record<string, React.ReactNode> = {
    org_created: <Building2 className="h-4 w-4 text-primary" />,
    migration_completed: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    status_change: <AlertCircle className="h-4 w-4 text-amber-500" />,
    user_added: <Users className="h-4 w-4 text-primary" />,
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
        {iconMap[activity.type] || <Building2 className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {activity.organizationName}
        </p>
        <p className="text-xs text-muted-foreground">
          {activity.description}
        </p>
      </div>
      <Badge variant="outline" className="text-xs shrink-0">
        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
      </Badge>
    </div>
  );
}

function PlatformOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
