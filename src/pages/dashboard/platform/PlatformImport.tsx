import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { DataImportWizard } from '@/components/admin/DataImportWizard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlatformCard,
  PlatformCardContent,
  PlatformCardHeader,
  PlatformCardTitle,
  PlatformCardDescription,
} from '@/components/platform/ui/PlatformCard';
import { PlatformButton } from '@/components/platform/ui/PlatformButton';
import { PlatformBadge } from '@/components/platform/ui/PlatformBadge';
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { PlatformPageHeader } from '@/components/platform/ui/PlatformPageHeader';

const importTypes = [
  { value: 'clients', label: 'Clients', description: 'Import customer data' },
  { value: 'services', label: 'Services', description: 'Import service catalog' },
  { value: 'appointments', label: 'Appointments', description: 'Import appointment history' },
];

export default function PlatformImport() {
  const [searchParams] = useSearchParams();
  const { data: organizations, isLoading } = useOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedDataType, setSelectedDataType] = useState<string>('');
  const [wizardOpen, setWizardOpen] = useState(false);

  // Pre-select organization from URL params
  useEffect(() => {
    const orgFromUrl = searchParams.get('org');
    if (orgFromUrl && organizations?.some(o => o.id === orgFromUrl)) {
      setSelectedOrgId(orgFromUrl);
    }
  }, [searchParams, organizations]);

  const selectedOrg = organizations?.find(o => o.id === selectedOrgId);

  const handleStartImport = (dataType: string) => {
    setSelectedDataType(dataType);
    setWizardOpen(true);
  };

  return (
    <PlatformPageContainer className="space-y-6">
      <PlatformPageHeader
        title="Data Migration"
        description="Import data from external software into accounts"
        backTo="/dashboard/platform/overview"
        backLabel="Back to Overview"
      />

      {/* Organization Selector */}
      <PlatformCard variant="glass">
        <PlatformCardHeader>
          <PlatformCardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-400" />
            Select Target Organization
          </PlatformCardTitle>
          <PlatformCardDescription>
            Choose which account to import data into
          </PlatformCardDescription>
        </PlatformCardHeader>
        <PlatformCardContent>
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="w-full max-w-md bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800/70 focus:ring-violet-500/30">
              <SelectValue placeholder="Select an organization..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {organizations?.map((org) => (
                <SelectItem 
                  key={org.id} 
                  value={org.id}
                  className="text-slate-300 focus:bg-slate-700 focus:text-white"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-violet-400" />
                    <span>{org.name}</span>
                    <span className="text-slate-500">
                      #{org.account_number ?? org.slug}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PlatformCardContent>
      </PlatformCard>

      {/* Import Options or Prompt */}
      {selectedOrgId && selectedOrg ? (
        <div className="space-y-4">
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <PlatformCardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-violet-400" />
                    Import Data for {selectedOrg.name}
                  </PlatformCardTitle>
                  <PlatformCardDescription>
                    Source software: {selectedOrg.source_software || 'Not specified'}
                  </PlatformCardDescription>
                </div>
                <PlatformBadge variant="outline">{selectedOrg.status}</PlatformBadge>
              </div>
            </PlatformCardHeader>
            <PlatformCardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {importTypes.map((type) => (
                  <PlatformCard 
                    key={type.value} 
                    variant="interactive"
                    className="cursor-pointer"
                  >
                    <PlatformCardHeader className="pb-2">
                      <PlatformCardTitle className="text-base flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-violet-400" />
                        {type.label}
                      </PlatformCardTitle>
                      <PlatformCardDescription className="text-xs">
                        {type.description}
                      </PlatformCardDescription>
                    </PlatformCardHeader>
                    <PlatformCardContent>
                      <PlatformButton 
                        className="w-full" 
                        size="sm"
                        onClick={() => handleStartImport(type.value)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Start Import
                      </PlatformButton>
                    </PlatformCardContent>
                  </PlatformCard>
                ))}
              </div>
            </PlatformCardContent>
          </PlatformCard>
        </div>
      ) : (
        <Alert className="bg-slate-800/50 border-slate-700/50 text-slate-300">
          <AlertCircle className="h-4 w-4 text-violet-400" />
          <AlertDescription>
            Please select an organization above to begin the data import process.
          </AlertDescription>
        </Alert>
      )}

      {/* Import Wizard Dialog */}
      {selectedOrg && (
        <DataImportWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          sourceType={selectedOrg.source_software || 'csv'}
          dataType={selectedDataType}
        />
      )}
    </PlatformPageContainer>
  );
}
