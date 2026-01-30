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
  Upload
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrganizations } from '@/hooks/useOrganizations';
import { CreateOrganizationDialog } from '@/components/platform/CreateOrganizationDialog';
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

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  pending: 'warning',
  active: 'success',
  suspended: 'error',
  churned: 'default',
};

const stageLabels: Record<string, string> = {
  new: 'New',
  importing: 'Importing Data',
  training: 'Training',
  live: 'Live',
};

export default function PlatformAccounts() {
  const navigate = useNavigate();
  const { data: organizations, isLoading } = useOrganizations();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredOrganizations = organizations?.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PlatformPageContainer className="space-y-6">
      <PlatformPageHeader
        title="Salon Accounts"
        description="Manage all salon organizations on the platform"
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
                    <TableHead className="text-slate-400">Salon</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Stage</TableHead>
                    <TableHead className="text-slate-400">Source</TableHead>
                    <TableHead className="text-slate-400">Created</TableHead>
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
                            <p className="text-xs text-slate-500">{org.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PlatformBadge variant={statusColors[org.status || 'pending']}>
                          {org.status}
                        </PlatformBadge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-300">
                          {stageLabels[org.onboarding_stage || 'new']}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {org.source_software || '—'}
                        </span>
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
                  : 'Create your first salon account to get started'}
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
