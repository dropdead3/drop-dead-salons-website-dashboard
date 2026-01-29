import React from 'react';
import { Building2, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useNavigate } from 'react-router-dom';

export function PlatformContextBanner() {
  const { selectedOrganization, isImpersonating, clearSelection } = useOrganizationContext();
  const navigate = useNavigate();

  if (!isImpersonating || !selectedOrganization) {
    return null;
  }

  const handleViewDetails = () => {
    navigate(`/dashboard/platform/accounts/${selectedOrganization.id}`);
  };

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Viewing as: <span className="text-primary">{selectedOrganization.name}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            ({selectedOrganization.slug})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewDetails}
            className="h-7 text-xs gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Account Details
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="h-7 text-xs gap-1 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3 w-3" />
            Exit View
          </Button>
        </div>
      </div>
    </div>
  );
}
