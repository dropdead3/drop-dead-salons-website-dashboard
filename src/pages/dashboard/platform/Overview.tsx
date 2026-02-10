import { useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Upload, 
  Plus, 
  ArrowRight,
  Clock,
  Sparkles,
  Settings
} from 'lucide-react';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';
import { PlatformButton } from '@/components/platform/ui/PlatformButton';
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { PlatformActivityFeed } from '@/components/platform/overview/PlatformActivityFeed';
import { PlatformLiveAnalytics } from '@/components/platform/overview/PlatformLiveAnalytics';
import { IncidentManagementCard } from '@/components/platform/overview/IncidentManagementCard';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

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
    <PlatformPageContainer>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display bg-gradient-to-r from-white via-white to-violet-300 bg-clip-text text-transparent">
              Platform Overview
            </h1>
            <p className="text-slate-400/80 mt-1.5">
              Manage accounts, migrations, and platform health
            </p>
          </div>
          <PlatformButton onClick={() => navigate('/dashboard/platform/accounts')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Account
          </PlatformButton>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={fadeUp} className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Accounts"
            value={stats?.totalOrganizations || 0}
            icon={Building2}
            description="Active accounts"
            href="/dashboard/platform/accounts"
          />
          <StatCard
            title="In Onboarding"
            value={stats?.onboardingOrganizations || 0}
            icon={Clock}
            description="Accounts being set up"
            variant="warning"
            href="/dashboard/platform/accounts?status=onboarding"
          />
          <StatCard
            title="Pending Migrations"
            value={stats?.pendingMigrations || 0}
            icon={Upload}
            description="Data imports in progress"
            variant={stats?.pendingMigrations ? 'warning' : 'default'}
            href="/dashboard/platform/import"
          />
          <StatCard
            title="Total Locations"
            value={stats?.totalLocations || 0}
            icon={MapPin}
            description="Across all accounts"
            href="/dashboard/platform/accounts"
          />
        </motion.div>

        {/* Incident Banner + Analytics Row */}
        <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PlatformLiveAnalytics />
          </div>
          <div className="lg:col-span-1">
            <IncidentManagementCard />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-violet-500/20">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <h2 className="text-lg font-medium text-white">Quick Actions</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
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
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={fadeUp}>
          <PlatformActivityFeed limit={10} />
        </motion.div>
      </motion.div>
    </PlatformPageContainer>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  variant?: 'default' | 'warning' | 'success';
  href?: string;
}

function StatCard({ title, value, icon: Icon, description, variant = 'default', href }: StatCardProps) {
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

  const cardClasses = "group/card relative rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-6 transition-all duration-300 hover:border-violet-500/30 hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.15)]";

  const content = (
    <>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/[0.07] via-purple-500/[0.04] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-400">{title}</span>
          <div className={cn('p-2.5 rounded-xl transition-all duration-300 group-hover/card:scale-105', iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className={cn('text-4xl font-medium tabular-nums tracking-tight', valueStyles[variant])}>{value}</div>
        <div className="h-px bg-gradient-to-r from-slate-600/40 to-transparent my-2.5" />
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={cn(cardClasses, "cursor-pointer block")}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClasses}>
      {content}
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
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/30 text-slate-200 hover:bg-slate-700/60 hover:text-white hover:border-violet-500/30 hover:border-l-violet-500/60 transition-all duration-300 group"
    >
      <Icon className="h-4 w-4 text-slate-400 group-hover:text-violet-400 transition-colors duration-300" />
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all duration-300" />
    </button>
  );
}

function PlatformOverviewSkeleton() {
  return (
    <div className="space-y-10">
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
