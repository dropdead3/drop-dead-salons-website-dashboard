import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  Plus, 
  Search, 
  ExternalLink,
  MoreHorizontal,
  Upload,
  MapPin,
  Pencil
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrganizationsWithStats, type OrganizationListItem } from '@/hooks/useOrganizations';
import { CreateOrganizationDialog } from '@/components/platform/CreateOrganizationDialog';
import { EditOrganizationDialog } from '@/components/platform/EditOrganizationDialog';
import { formatDistanceToNow } from 'date-fns';
import {
  PlatformCard,
  PlatformCardContent,
  PlatformCardHeader,
  PlatformCardTitle,
} from '@/components/platform/ui/PlatformCard';
import { PlatformButton } from '@/components/platform/ui/PlatformButton';
import { PlatformInput } from '@/components/platform/ui/PlatformInput';
import { PlatformBadge } from '@/components/platform/ui/PlatformBadge';
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { PlatformPageHeader } from '@/components/platform/ui/PlatformPageHeader';
import { StripeStatusIndicator } from '@/components/platform/ui/StripeStatusIndicator';

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  pending: 'warning',
  active: 'success',
  suspended: 'error',
  churned: 'default',
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

const planLabels: Record<string, string> = {
  starter: 'Starter',
  standard: 'Standard',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export default function PlatformAccounts() {
  const navigate = useNavigate();
  const { data: organizations, isLoading } = useOrganizationsWithStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<OrganizationListItem | null>(null);

  const filteredOrganizations = organizations?.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PlatformPageContainer className="space-y-6">
      <PlatformPageHeader
        title="Accounts"
        description="Manage all organizations on the platform"
        backTo="/dashboard/platform/overview"
        backLabel="Back to Overview"
        actions={
          <PlatformButton onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Account
          </PlatformButton>
        }
      />

      {/* Filters */}
      <PlatformCard variant="glass">
        <PlatformCardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <PlatformInput
                placeholder="Search by name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4" />}
                autoCapitalize="none"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800/70 focus:ring-violet-500/30">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-slate-300 focus:bg-slate-700 focus:text-white">All Statuses</SelectItem>
                <SelectItem value="pending" className="text-slate-300 focus:bg-slate-700 focus:text-white">Pending</SelectItem>
                <SelectItem value="active" className="text-slate-300 focus:bg-slate-700 focus:text-white">Active</SelectItem>
                <SelectItem value="suspended" className="text-slate-300 focus:bg-slate-700 focus:text-white">Suspended</SelectItem>
                <SelectItem value="churned" className="text-slate-300 focus:bg-slate-700 focus:text-white">Churned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PlatformCardContent>
      </PlatformCard>

      {/* Accounts Table */}
      <PlatformCard variant="glass">
        <PlatformCardHeader>
          <PlatformCardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-400" />
            Organizations ({filteredOrganizations?.length || 0})
          </PlatformCardTitle>
        </PlatformCardHeader>
        <PlatformCardContent>
          {isLoading ? (
            <AccountsTableSkeleton />
          ) : filteredOrganizations && filteredOrganizations.length > 0 ? (
            <div className="rounded-xl overflow-hidden border border-slate-700/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-transparent">
                    <TableHead className="text-slate-400">Account</TableHead>
                    <TableHead className="text-slate-400">Type</TableHead>
                    <TableHead className="text-slate-400">Location</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Plan</TableHead>
                    <TableHead className="text-slate-400">Locations</TableHead>
                    <TableHead className="text-slate-400">Payments</TableHead>
                    <TableHead className="text-right text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow 
                      key={org.id}
                      className="cursor-pointer border-slate-700/50 hover:bg-slate-800/50 transition-colors"
                      onClick={() => navigate(`/dashboard/platform/accounts/${org.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                            {org.logo_url ? (
                              <img src={org.logo_url} alt={org.name} className="h-8 w-8 rounded-lg object-cover" />
                            ) : (
                              <Building2 className="h-5 w-5 text-violet-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{org.name}</p>
                            <p className="text-xs text-slate-500">#{org.account_number}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-300">
                          {businessTypeLabels[org.business_type || 'salon']}
                        </span>
                      </TableCell>
                      <TableCell>
                        {org.primaryLocation ? (
                          <span className="text-sm text-slate-300">
                            {org.primaryLocation.state_province && `${org.primaryLocation.state_province}, `}
                            {org.primaryLocation.country || 'US'}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <PlatformBadge variant={statusColors[org.status || 'pending']}>
                          {org.status}
                        </PlatformBadge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-300">
                          {planLabels[org.subscription_tier || 'standard'] || org.subscription_tier || 'Standard'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          <span className="text-sm text-slate-300">{org.locationCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StripeStatusIndicator
                          activeCount={org.stripeLocationsActive}
                          totalCount={org.locationCount}
                          hasIssues={org.hasStripeIssues}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <PlatformButton variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </PlatformButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem 
                              className="text-slate-300 focus:bg-slate-700 focus:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/platform/accounts/${org.id}`);
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-slate-300 focus:bg-slate-700 focus:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditOrg(org);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-slate-300 focus:bg-slate-700 focus:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/platform/import?org=${org.id}`);
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Start Import
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No organizations found</h3>
              <p className="text-slate-500 mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first account to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <PlatformButton onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Account
                </PlatformButton>
              )}
            </div>
          )}
        </PlatformCardContent>
      </PlatformCard>

      <CreateOrganizationDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />

      {editOrg && (
        <EditOrganizationDialog
          organization={editOrg}
          open={!!editOrg}
          onOpenChange={(open) => !open && setEditOrg(null)}
        />
      )}
    </PlatformPageContainer>
  );
}

function AccountsTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30">
          <Skeleton className="h-10 w-10 rounded-xl bg-slate-700" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 bg-slate-700" />
            <Skeleton className="h-3 w-24 bg-slate-700" />
          </div>
          <Skeleton className="h-6 w-16 bg-slate-700" />
          <Skeleton className="h-4 w-20 bg-slate-700" />
          <Skeleton className="h-4 w-24 bg-slate-700" />
        </div>
      ))}
    </div>
  );
}
