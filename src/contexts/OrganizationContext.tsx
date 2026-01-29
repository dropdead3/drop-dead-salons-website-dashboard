import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Organization } from '@/hooks/useOrganizations';

interface OrganizationContextValue {
  selectedOrganization: Organization | null;
  setSelectedOrganization: (org: Organization | null) => void;
  clearSelection: () => void;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  const clearSelection = useCallback(() => {
    setSelectedOrganization(null);
  }, []);

  return (
    <OrganizationContext.Provider value={{ 
      selectedOrganization, 
      setSelectedOrganization, 
      clearSelection 
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
}
