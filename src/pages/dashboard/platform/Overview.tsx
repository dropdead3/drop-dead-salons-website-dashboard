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
  Sparkles,
  Settings
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
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';

export default function PlatformOverview() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useOrganizationStats();

  if (isLoading) {
    return (
      <PlatformPageContainer>
        <PlatformOverviewSkeleton />
      </PlatformPageContainer>
    );
  }

  return (
    <PlatformPageContainer className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Platform Overview</h1>
          <p className="text-slate-400 mt-1">
            Manage salon accounts, migrations, and platform health
          </p>
        </div>
        <PlatformButton onClick={() => navigate('/dashboard/platform/accounts')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Salon Account
        </PlatformButton>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-xl bg-violet-500/20">
                <Sparkles className="h-4 w-4 text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <QuickActionButton 
                icon={Building2}
                label="View All Accounts"
                onClick={() => navigate('/dashboard/platform/accounts')}
              />
              <QuickActionButton 
                icon={Upload}
                label="Start Migration"
                onClick={() => navigate('/dashboard/platform/import')}
              />
              <QuickActionButton 
                icon={Settings}
                label="Platform Settings"
                onClick={() => navigate('/dashboard/platform/settings')}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <PlatformButton 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard/platform/accounts')}
                className="text-slate-400 hover:text-white"
              >
                View all
              </PlatformButton>
            </div>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-700/50 mb-4">
                  <Building2 className="h-8 w-8 text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">No recent activity</p>
                <p className="text-sm text-slate-500 mt-1">Create your first salon account to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PlatformPageContainer>
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
  const iconStyles = {
    default: 'bg-violet-500/20 text-violet-400',
    warning: 'bg-amber-500/20 text-amber-400',
    success: 'bg-emerald-500/20 text-emerald-400',
  };

  const valueStyles = {
    default: 'text-white',
    warning: 'text-amber-300',
    success: 'text-emerald-300',
  };

  return (
    <div className="group relative rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-6 transition-all duration-300 hover:bg-slate-800/60 hover:border-slate-600/50">
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">{title}</span>
          <div className={`p-2.5 rounded-xl ${iconStyles[variant]} transition-colors`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className={`text-4xl font-bold ${valueStyles[variant]} mb-1`}>{value}</div>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

function QuickActionButton({ icon: Icon, label, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/30 text-slate-200 hover:bg-slate-700/60 hover:text-white hover:border-slate-500/50 transition-all duration-200 group"
    >
      <Icon className="h-4 w-4 text-slate-400 group-hover:text-violet-400 transition-colors" />
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
    </button>
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
  const iconMap: Record<string, { icon: React.ReactNode; bg: string }> = {
    org_created: { 
      icon: <Building2 className="h-4 w-4 text-violet-400" />,
      bg: 'bg-violet-500/20'
    },
    migration_completed: { 
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      bg: 'bg-emerald-500/20'
    },
    status_change: { 
      icon: <AlertCircle className="h-4 w-4 text-amber-400" />,
      bg: 'bg-amber-500/20'
    },
    user_added: { 
      icon: <Users className="h-4 w-4 text-violet-400" />,
      bg: 'bg-violet-500/20'
    },
  };

  const { icon, bg } = iconMap[activity.type] || { 
    icon: <Building2 className="h-4 w-4 text-slate-400" />,
    bg: 'bg-slate-700/50'
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/30 border border-slate-600/20 hover:bg-slate-700/50 hover:border-slate-600/40 transition-all duration-200">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {activity.organizationName}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {activity.description}
        </p>
      </div>
      <PlatformBadge variant="outline" size="sm" className="text-slate-500 border-slate-600/50">
        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
      </PlatformBadge>
    </div>
  );
}

function PlatformOverviewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2 bg-slate-700/50" />
          <Skeleton className="h-5 w-72 bg-slate-700/50" />
        </div>
        <Skeleton className="h-10 w-40 bg-slate-700/50" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24 bg-slate-700/50" />
              <Skeleton className="h-10 w-10 rounded-xl bg-slate-700/50" />
            </div>
            <Skeleton className="h-10 w-16 mb-2 bg-slate-700/50" />
            <Skeleton className="h-4 w-32 bg-slate-700/50" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6">
          <Skeleton className="h-6 w-32 mb-5 bg-slate-700/50" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl bg-slate-700/50" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6">
          <Skeleton className="h-6 w-32 mb-5 bg-slate-700/50" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-700/50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
