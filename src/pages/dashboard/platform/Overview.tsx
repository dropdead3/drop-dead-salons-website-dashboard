import { useNavigate } from 'react-router-dom';
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
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';
import { formatDistanceToNow } from 'date-fns';
import {
  PlatformCard,
  PlatformCardContent,
  PlatformCardHeader,
  PlatformCardTitle,
} from '@/components/platform/ui/PlatformCard';
import { PlatformButton } from '@/components/platform/ui/PlatformButton';
import { PlatformBadge } from '@/components/platform/ui/PlatformBadge';

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
          <h1 className="text-3xl font-bold tracking-tight text-white">Platform Overview</h1>
          <p className="text-slate-400">
            Manage salon accounts, migrations, and platform health
          </p>
        </div>
        <PlatformButton onClick={() => navigate('/dashboard/platform/accounts')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Salon Account
        </PlatformButton>
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
        <PlatformCard variant="glass" className="lg:col-span-1">
          <PlatformCardHeader>
            <PlatformCardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              Quick Actions
            </PlatformCardTitle>
          </PlatformCardHeader>
          <PlatformCardContent className="space-y-2">
            <PlatformButton 
              variant="secondary" 
              className="w-full justify-start gap-2"
              onClick={() => navigate('/dashboard/platform/accounts')}
            >
              <Building2 className="h-4 w-4" />
              View All Accounts
              <ArrowRight className="h-4 w-4 ml-auto" />
            </PlatformButton>
            <PlatformButton 
              variant="secondary" 
              className="w-full justify-start gap-2"
              onClick={() => navigate('/dashboard/platform/import')}
            >
              <Upload className="h-4 w-4" />
              Start Migration
              <ArrowRight className="h-4 w-4 ml-auto" />
            </PlatformButton>
            <PlatformButton 
              variant="secondary" 
              className="w-full justify-start gap-2"
              onClick={() => navigate('/dashboard/platform/settings')}
            >
              <Users className="h-4 w-4" />
              Platform Settings
              <ArrowRight className="h-4 w-4 ml-auto" />
            </PlatformButton>
          </PlatformCardContent>
        </PlatformCard>

        {/* Recent Activity */}
        <PlatformCard variant="glass" className="lg:col-span-2">
          <PlatformCardHeader className="flex flex-row items-center justify-between">
            <PlatformCardTitle className="text-lg">Recent Activity</PlatformCardTitle>
            <PlatformButton variant="ghost" size="sm" onClick={() => navigate('/dashboard/platform/accounts')}>
              View all
            </PlatformButton>
          </PlatformCardHeader>
          <PlatformCardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Create your first salon account to get started</p>
              </div>
            )}
          </PlatformCardContent>
        </PlatformCard>
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
  const iconVariants = {
    default: 'text-violet-400',
    warning: 'text-amber-400',
    success: 'text-emerald-400',
  };

  const valueVariants = {
    default: 'text-white',
    warning: 'text-amber-300',
    success: 'text-emerald-300',
  };

  return (
    <PlatformCard variant="interactive" className="group">
      <PlatformCardHeader className="flex flex-row items-center justify-between pb-2">
        <PlatformCardTitle className="text-sm font-medium text-slate-400">{title}</PlatformCardTitle>
        <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-violet-500/20 transition-colors">
          <Icon className={`h-4 w-4 ${iconVariants[variant]} transition-colors`} />
        </div>
      </PlatformCardHeader>
      <PlatformCardContent>
        <div className={`text-3xl font-bold ${valueVariants[variant]}`}>{value}</div>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </PlatformCardContent>
    </PlatformCard>
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
    org_created: <Building2 className="h-4 w-4 text-violet-400" />,
    migration_completed: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    status_change: <AlertCircle className="h-4 w-4 text-amber-400" />,
    user_added: <Users className="h-4 w-4 text-violet-400" />,
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700/50">
        {iconMap[activity.type] || <Building2 className="h-4 w-4 text-slate-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {activity.organizationName}
        </p>
        <p className="text-xs text-slate-500">
          {activity.description}
        </p>
      </div>
      <PlatformBadge variant="outline" size="sm">
        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
      </PlatformBadge>
    </div>
  );
}

function PlatformOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2 bg-slate-800" />
          <Skeleton className="h-5 w-72 bg-slate-800" />
        </div>
        <Skeleton className="h-10 w-40 bg-slate-800" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <PlatformCard key={i}>
            <PlatformCardHeader className="pb-2">
              <Skeleton className="h-4 w-24 bg-slate-700" />
            </PlatformCardHeader>
            <PlatformCardContent>
              <Skeleton className="h-8 w-16 mb-1 bg-slate-700" />
              <Skeleton className="h-3 w-32 bg-slate-700" />
            </PlatformCardContent>
          </PlatformCard>
        ))}
      </div>
    </div>
  );
}
