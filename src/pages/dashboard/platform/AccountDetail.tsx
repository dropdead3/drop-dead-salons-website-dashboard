import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  ArrowLeft,
  MapPin,
  Users,
  Upload,
  Settings,
  Mail,
  Phone,
  Globe,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useOrganizationWithStats } from '@/hooks/useOrganizations';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  suspended: 'bg-destructive/10 text-destructive',
  churned: 'bg-muted text-muted-foreground',
};

const stageConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  new: { label: 'New', icon: <Clock className="h-4 w-4" />, color: 'text-muted-foreground' },
  importing: { label: 'Importing Data', icon: <Upload className="h-4 w-4" />, color: 'text-primary' },
  training: { label: 'Training', icon: <Users className="h-4 w-4" />, color: 'text-amber-600 dark:text-amber-400' },
  live: { label: 'Live', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-600 dark:text-emerald-400' },
};

export default function AccountDetail() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { data: organization, isLoading } = useOrganizationWithStats(orgId);

  if (isLoading) {
    return <AccountDetailSkeleton />;
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-1">Organization not found</h3>
        <p className="text-muted-foreground mb-4">
          The organization you're looking for doesn't exist or you don't have access.
        </p>
        <Button onClick={() => navigate('/dashboard/platform/accounts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Accounts
        </Button>
      </div>
    );
  }

  const stage = stageConfig[organization.onboarding_stage || 'new'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/platform/accounts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
            {organization.logo_url ? (
              <img src={organization.logo_url} alt={organization.name} className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <Building2 className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{organization.name}</h1>
              <Badge className={statusColors[organization.status || 'pending']}>
                {organization.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{organization.slug}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/dashboard/platform/import?org=${organization.id}`)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stage.color}`}>
                {stage.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Onboarding Stage</p>
                <p className="font-semibold">{stage.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Locations</p>
                <p className="font-semibold">{organization.locationCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="font-semibold">{organization.adminCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Upload className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Imports</p>
                <p className="font-semibold">{organization.completedImports} / {organization.importCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="imports">Imports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {organization.primary_contact_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{organization.primary_contact_email}</span>
                  </div>
                )}
                {organization.primary_contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{organization.primary_contact_phone}</span>
                  </div>
                )}
                {!organization.primary_contact_email && !organization.primary_contact_phone && (
                  <p className="text-muted-foreground text-sm">No contact information provided</p>
                )}
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created {format(new Date(organization.created_at), 'MMM d, yyyy')}</span>
                </div>
                {organization.activated_at && (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Activated {format(new Date(organization.activated_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>Source: {organization.source_software || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Plan: {organization.subscription_tier || 'Standard'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Locations</CardTitle>
              <Button size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Location management coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <Button size="sm">
                <Users className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                User management coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Import History</CardTitle>
              <Button size="sm" onClick={() => navigate(`/dashboard/platform/import?org=${organization.id}`)}>
                <Upload className="h-4 w-4 mr-2" />
                New Import
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No imports yet for this organization
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Settings configuration coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AccountDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
