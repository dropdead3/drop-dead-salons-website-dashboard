import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  MapPin,
  Users,
  Upload,
  Pencil,
  Mail,
  Phone,
  Globe,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageSquare,
  Target,
  LayoutDashboard
} from 'lucide-react';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { logPlatformAction } from '@/hooks/useOrganizations';
import { useOrganizationWithStats, type OrganizationWithStats } from '@/hooks/useOrganizations';
import { EditOrganizationDialog } from '@/components/platform/EditOrganizationDialog';
import { BillingConfigurationPanel } from '@/components/platform/billing/BillingConfigurationPanel';
import { AccountNotesSection } from '@/components/platform/notes/AccountNotesSection';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import {
  PlatformCard,
  PlatformCardContent,
  PlatformCardHeader,
  PlatformCardTitle,
} from '@/components/platform/ui/PlatformCard';
import { PlatformButton } from '@/components/platform/ui/PlatformButton';
import { PlatformBadge } from '@/components/platform/ui/PlatformBadge';
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { PlatformPageHeader } from '@/components/platform/ui/PlatformPageHeader';
import type { BillingStatus } from '@/hooks/useOrganizationBilling';

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  pending: 'warning',
  active: 'success',
  suspended: 'error',
  churned: 'default',
};

const stageConfig: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'primary' | 'warning' | 'success' }> = {
  new: { label: 'New', icon: <Clock className="h-4 w-4" />, variant: 'default' },
  importing: { label: 'Importing Data', icon: <Upload className="h-4 w-4" />, variant: 'primary' },
  training: { label: 'Training', icon: <Users className="h-4 w-4" />, variant: 'warning' },
  live: { label: 'Live', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'success' },
};

const businessTypeLabels: Record<string, string> = {
  salon: 'Salon',
  spa: 'Spa',
  esthetics: 'Esthetics',
  barbershop: 'Barbershop',
  med_spa: 'Med Spa',
  wellness: 'Wellness',
  other: 'Other',
};

export default function AccountDetail() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'overview';
  const { setSelectedOrganization } = useOrganizationContext();
  const { data: organization, isLoading } = useOrganizationWithStats(orgId);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <PlatformPageContainer>
        <AccountDetailSkeleton />
      </PlatformPageContainer>
    );
  }

  if (!organization) {
    return (
      <PlatformPageContainer>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">Organization not found</h3>
          <p className="text-slate-500 mb-4">
            The organization you're looking for doesn't exist or you don't have access.
          </p>
          <PlatformButton onClick={() => navigate('/dashboard/platform/accounts')}>
            ← Back to Accounts
          </PlatformButton>
        </div>
      </PlatformPageContainer>
    );
  }

  const stage = stageConfig[organization.onboarding_stage || 'new'];

  return (
    <PlatformPageContainer className="space-y-6">
      {/* Header */}
      <PlatformPageHeader
        title={organization.name}
        description={organization.slug}
        backTo="/dashboard/platform/accounts"
        backLabel="Back to Accounts"
        actions={
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mr-2">
              {organization.logo_url ? (
                <img src={organization.logo_url} alt={organization.name} className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <Building2 className="h-6 w-6 text-violet-400" />
              )}
            </div>
            <PlatformBadge variant={statusColors[organization.status || 'pending']}>
              {organization.status}
            </PlatformBadge>
            <PlatformButton variant="secondary" onClick={() => navigate(`/dashboard/platform/import?org=${organization.id}`)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </PlatformButton>
            <PlatformButton 
              variant="secondary" 
              onClick={() => {
                setSelectedOrganization(organization);
                logPlatformAction(organization.id, 'dashboard_accessed', 'organization', organization.id, {
                  organization_name: organization.name,
                  action: 'view_dashboard',
                });
                navigate('/dashboard');
              }}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              View Dashboard
            </PlatformButton>
            <PlatformButton onClick={() => setEditDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Account
            </PlatformButton>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <PlatformCard variant="interactive" className="group">
          <PlatformCardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-violet-500/20 transition-colors">
                {stage.icon}
              </div>
              <div>
                <p className="text-sm text-slate-500">Onboarding Stage</p>
                <p className="font-semibold text-white">{stage.label}</p>
              </div>
            </div>
          </PlatformCardContent>
        </PlatformCard>
        <PlatformCard variant="interactive" className="group">
          <PlatformCardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-violet-500/20 transition-colors">
                <MapPin className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Locations</p>
                <p className="font-semibold text-white">{organization.locationCount}</p>
              </div>
            </div>
          </PlatformCardContent>
        </PlatformCard>
        <PlatformCard variant="interactive" className="group">
          <PlatformCardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-violet-500/20 transition-colors">
                <Users className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Team Members</p>
                <p className="font-semibold text-white">{organization.adminCount}</p>
              </div>
            </div>
          </PlatformCardContent>
        </PlatformCard>
        <PlatformCard variant="interactive" className="group">
          <PlatformCardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-violet-500/20 transition-colors">
                <Upload className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Imports</p>
                <p className="font-semibold text-white">{organization.completedImports} / {organization.importCount}</p>
              </div>
            </div>
          </PlatformCardContent>
        </PlatformCard>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="locations"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
          >
            Locations
          </TabsTrigger>
          <TabsTrigger 
            value="users"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
          >
            Users
          </TabsTrigger>
          <TabsTrigger 
            value="imports"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
          >
            Imports
          </TabsTrigger>
          <TabsTrigger 
            value="billing"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger 
            value="notes"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Contact Info */}
            <PlatformCard variant="glass">
              <PlatformCardHeader>
                <PlatformCardTitle className="text-lg">Contact Information</PlatformCardTitle>
              </PlatformCardHeader>
              <PlatformCardContent className="space-y-4">
                {organization.primary_contact_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-300">{organization.primary_contact_email}</span>
                  </div>
                )}
                {organization.primary_contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-300">{organization.primary_contact_phone}</span>
                  </div>
                )}
                {!organization.primary_contact_email && !organization.primary_contact_phone && (
                  <p className="text-slate-500 text-sm">No contact information provided</p>
                )}
              </PlatformCardContent>
            </PlatformCard>

            {/* Account Details */}
            <PlatformCard variant="glass">
              <PlatformCardHeader>
                <PlatformCardTitle className="text-lg">Account Details</PlatformCardTitle>
              </PlatformCardHeader>
              <PlatformCardContent className="space-y-4">
                {organization.account_number && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-violet-400" />
                    <span className="text-slate-300">Account #{organization.account_number}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-300">Created {format(new Date(organization.created_at), 'MMM d, yyyy')}</span>
                </div>
                {organization.go_live_date && (
                  <div className="flex items-center gap-3">
                    <Target className={`h-4 w-4 ${
                      organization.onboarding_stage === 'live' 
                        ? 'text-emerald-400' 
                        : isBefore(parseISO(organization.go_live_date), startOfDay(new Date()))
                          ? 'text-red-400'
                          : 'text-amber-400'
                    }`} />
                    <span className={`${
                      organization.onboarding_stage === 'live' 
                        ? 'text-emerald-400' 
                        : isBefore(parseISO(organization.go_live_date), startOfDay(new Date()))
                          ? 'text-red-400'
                          : 'text-slate-300'
                    }`}>
                      Go-Live {format(parseISO(organization.go_live_date), 'MMM d, yyyy')}
                      {organization.onboarding_stage !== 'live' && isBefore(parseISO(organization.go_live_date), startOfDay(new Date())) && ' (overdue)'}
                    </span>
                  </div>
                )}
                {organization.activated_at && (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-slate-300">Activated {format(new Date(organization.activated_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-300">Type: {businessTypeLabels[organization.business_type || 'salon']}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-300">Source: {organization.source_software || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-300">Plan: {organization.subscription_tier || 'Standard'}</span>
                </div>
              </PlatformCardContent>
            </PlatformCard>
          </div>
        </TabsContent>

        <TabsContent value="locations">
          <PlatformCard variant="glass">
            <PlatformCardHeader className="flex flex-row items-center justify-between">
              <PlatformCardTitle>Locations</PlatformCardTitle>
              <PlatformButton size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Add Location
              </PlatformButton>
            </PlatformCardHeader>
            <PlatformCardContent>
              <p className="text-slate-500 text-center py-8">
                Location management coming soon
              </p>
            </PlatformCardContent>
          </PlatformCard>
        </TabsContent>

        <TabsContent value="users">
          <PlatformCard variant="glass">
            <PlatformCardHeader className="flex flex-row items-center justify-between">
              <PlatformCardTitle>Team Members</PlatformCardTitle>
              <PlatformButton size="sm">
                <Users className="h-4 w-4 mr-2" />
                Add User
              </PlatformButton>
            </PlatformCardHeader>
            <PlatformCardContent>
              <p className="text-slate-500 text-center py-8">
                User management coming soon
              </p>
            </PlatformCardContent>
          </PlatformCard>
        </TabsContent>

        <TabsContent value="imports">
          <PlatformCard variant="glass">
            <PlatformCardHeader className="flex flex-row items-center justify-between">
              <PlatformCardTitle>Import History</PlatformCardTitle>
              <PlatformButton size="sm" onClick={() => navigate(`/dashboard/platform/import?org=${organization.id}`)}>
                <Upload className="h-4 w-4 mr-2" />
                New Import
              </PlatformButton>
            </PlatformCardHeader>
            <PlatformCardContent>
              <p className="text-slate-500 text-center py-8">
                No imports yet for this organization
              </p>
            </PlatformCardContent>
          </PlatformCard>
        </TabsContent>

        <TabsContent value="billing">
          <BillingConfigurationPanel
            organizationId={organization.id}
            billingStatus={(organization as any).billing_status as BillingStatus || 'draft'}
            locationCount={organization.locationCount}
          />
        </TabsContent>

        <TabsContent value="notes">
          <AccountNotesSection
            organizationId={organization.id}
            organizationName={organization.name}
          />
        </TabsContent>

        <TabsContent value="settings">
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle>Organization Settings</PlatformCardTitle>
            </PlatformCardHeader>
            <PlatformCardContent>
              <p className="text-slate-500 text-center py-8">
                Settings configuration coming soon
              </p>
            </PlatformCardContent>
          </PlatformCard>
        </TabsContent>
      </Tabs>

      <EditOrganizationDialog
        organization={organization}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </PlatformPageContainer>
  );
}

function AccountDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 bg-slate-800" />
        <Skeleton className="h-16 w-16 rounded-2xl bg-slate-800" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-slate-800" />
          <Skeleton className="h-4 w-24 bg-slate-800" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <PlatformCard key={i}>
            <PlatformCardContent className="pt-6">
              <Skeleton className="h-12 w-full bg-slate-700" />
            </PlatformCardContent>
          </PlatformCard>
        ))}
      </div>
    </div>
  );
}
