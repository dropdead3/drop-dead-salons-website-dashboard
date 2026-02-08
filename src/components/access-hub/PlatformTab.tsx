import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Flag, 
  Search,
  Info,
  FlaskConical,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrganizationFeatureFlags, useUpdateOrgFeatureFlag, MergedFeatureFlag } from '@/hooks/useOrganizationFeatureFlags';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

interface PlatformTabProps {
  canManage: boolean;
}

export function PlatformTab({ canManage }: PlatformTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { isPlatformUser } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id || '';
  
  const { data: featureFlags = [], isLoading } = useOrganizationFeatureFlags(orgId);
  const updateFlag = useUpdateOrgFeatureFlag();

  // Filter by search
  const filteredFlags = featureFlags.filter(flag => 
    flag.flag_key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate into categories
  const experimentFlags = filteredFlags.filter(f => f.flag_key.startsWith('experiment_') || f.flag_key.includes('beta'));
  const rolloutFlags = filteredFlags.filter(f => !experimentFlags.includes(f));

  const handleToggle = (flagKey: string, enabled: boolean) => {
    if (!orgId) return;
    updateFlag.mutate({ organizationId: orgId, flagKey, isEnabled: enabled });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Description Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="h-4 w-4" />
            Feature Flags & Experiments
          </CardTitle>
          <CardDescription>
            Override platform feature flags for your organization. These control experimental features and gradual rollouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant="outline" className="text-sm py-1.5 px-3">
              {featureFlags.filter(f => f.org_enabled).length} of {featureFlags.length} enabled
            </Badge>
            {!isPlatformUser && (
              <Badge variant="secondary" className="text-sm py-1.5 px-3 gap-1">
                <AlertTriangle className="h-3 w-3" />
                Platform features only
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Platform Access Warning */}
      {!isPlatformUser && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-500 mb-1">Platform Features</p>
            <p className="text-amber-600/80 dark:text-amber-400/80">
              Feature flags are managed by the platform team. Contact support if you need access 
              to experimental features for your organization.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search feature flags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Experiments Section */}
      {experimentFlags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-sm">Experiments & Beta Features</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {experimentFlags.filter(f => f.org_enabled).length}/{experimentFlags.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {experimentFlags.map(flag => (
              <FlagRow
                key={flag.flag_key}
                flag={flag}
                onToggle={handleToggle}
                canManage={canManage && isPlatformUser}
                isUpdating={updateFlag.isPending}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rollouts Section */}
      {rolloutFlags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm">Feature Rollouts</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {rolloutFlags.filter(f => f.org_enabled).length}/{rolloutFlags.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {rolloutFlags.map(flag => (
              <FlagRow
                key={flag.flag_key}
                flag={flag}
                onToggle={handleToggle}
                canManage={canManage && isPlatformUser}
                isUpdating={updateFlag.isPending}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredFlags.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No feature flags available for your organization.</p>
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">About feature flags</p>
          <p>
            Feature flags allow the platform to gradually roll out new features or run experiments.
            Unlike modules which you control, feature flags are primarily managed by the platform team.
            Overrides here apply only to your organization.
          </p>
        </div>
      </div>
    </div>
  );
}

// Flag row component
function FlagRow({ 
  flag, 
  onToggle, 
  canManage, 
  isUpdating 
}: { 
  flag: MergedFeatureFlag;
  onToggle: (flagKey: string, enabled: boolean) => void;
  canManage: boolean;
  isUpdating: boolean;
}) {
  // Format flag key for display
  const displayName = flag.flag_key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md bg-background/50 border border-border/50",
        !flag.org_enabled && "opacity-50"
      )}
    >
      <Switch
        checked={flag.org_enabled}
        onCheckedChange={(checked) => onToggle(flag.flag_key, checked)}
        disabled={!canManage || isUpdating}
        className="data-[state=checked]:bg-primary"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium",
            !flag.org_enabled && "line-through text-muted-foreground"
          )}>
            {displayName}
          </span>
          {flag.has_override && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary">
              Override
            </Badge>
          )}
          {flag.org_enabled !== flag.global_enabled && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] px-1.5 py-0",
                flag.org_enabled ? "border-green-500/50 text-green-600" : "border-red-500/50 text-red-600"
              )}
            >
              {flag.org_enabled ? 'Enabled' : 'Disabled'} (Global: {flag.global_enabled ? 'On' : 'Off'})
            </Badge>
          )}
        </div>
        {flag.override_reason && (
          <div className="text-xs text-muted-foreground truncate">
            {flag.override_reason}
          </div>
        )}
      </div>
      <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono hidden sm:block">
        {flag.flag_key}
      </code>
    </div>
  );
}
