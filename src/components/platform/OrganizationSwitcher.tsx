import React, { useState } from 'react';
import { Check, ChevronsUpDown, Building2, Globe, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useOrganizations, type Organization, logPlatformAction } from '@/hooks/useOrganizations';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

interface OrganizationSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function OrganizationSwitcher({ className, compact = false }: OrganizationSwitcherProps) {
  const [open, setOpen] = useState(false);
  const { data: organizations = [], isLoading } = useOrganizations();
  const { selectedOrganization, setSelectedOrganization, isImpersonating } = useOrganizationContext();

  const handleSelect = (org: Organization | null) => {
    setSelectedOrganization(org);
    setOpen(false);
    
    // Log the context switch for audit
    if (org) {
      logPlatformAction(org.id, 'org_viewed', 'organization', org.id, {
        organization_name: org.name,
        organization_slug: org.slug,
        action: 'context_switch',
      });
    }
  };

  const activeOrgs = organizations.filter(o => o.status === 'active');
  const onboardingOrgs = organizations.filter(o => o.status !== 'active');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isImpersonating ? 'default' : 'outline'}
          role="combobox"
          aria-expanded={open}
          className={cn(
            'justify-between gap-2',
            compact ? 'w-[200px]' : 'w-[280px]',
            isImpersonating && 'bg-primary/10 border-primary text-primary hover:bg-primary/20',
            className
          )}
        >
          {selectedOrganization ? (
            <div className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{selectedOrganization.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Platform View</span>
            </div>
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Loading...' : 'No organizations found.'}
            </CommandEmpty>
            
            {/* Platform-wide option */}
            <CommandGroup>
              <CommandItem
                onSelect={() => handleSelect(null)}
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                <span>Platform View</span>
                <span className="ml-auto text-xs text-muted-foreground">All accounts</span>
                {!selectedOrganization && (
                  <Check className="ml-2 h-4 w-4" />
                )}
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator />
            
            {/* Active organizations */}
            {activeOrgs.length > 0 && (
              <CommandGroup heading="Active Accounts">
                {activeOrgs.map((org) => (
                  <CommandItem
                    key={org.id}
                    onSelect={() => handleSelect(org)}
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate">{org.name}</span>
                      <span className="text-xs text-muted-foreground">{org.slug}</span>
                    </div>
                    {selectedOrganization?.id === org.id && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {/* Onboarding organizations */}
            {onboardingOrgs.length > 0 && (
              <CommandGroup heading="Onboarding">
                {onboardingOrgs.map((org) => (
                  <CommandItem
                    key={org.id}
                    onSelect={() => handleSelect(org)}
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate">{org.name}</span>
                      <span className="text-xs text-muted-foreground">{org.slug}</span>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {org.onboarding_stage}
                    </Badge>
                    {selectedOrganization?.id === org.id && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
