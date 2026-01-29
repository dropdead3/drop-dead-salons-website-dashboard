import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { DataImportWizard } from '@/components/admin/DataImportWizard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Migration</h1>
        <p className="text-muted-foreground">
          Import data from external software into salon accounts
        </p>
      </div>

      {/* Organization Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Select Target Organization
          </CardTitle>
          <CardDescription>
            Choose which salon account to import data into
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a salon organization..." />
            </SelectTrigger>
            <SelectContent>
              {organizations?.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{org.name}</span>
                    <span className="text-muted-foreground">({org.slug})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Import Options or Prompt */}
      {selectedOrgId && selectedOrg ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Data for {selectedOrg.name}
                  </CardTitle>
                  <CardDescription>
                    Source software: {selectedOrg.source_software || 'Not specified'}
                  </CardDescription>
                </div>
                <Badge variant="outline">{selectedOrg.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {importTypes.map((type) => (
                  <Card key={type.value} className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        {type.label}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {type.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => handleStartImport(type.value)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Start Import
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
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
    </div>
  );
}
