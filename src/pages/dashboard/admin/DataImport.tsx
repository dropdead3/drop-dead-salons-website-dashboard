import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Database,
  Users,
  Calendar,
  Scissors,
  DollarSign,
  History,
  Loader2
} from 'lucide-react';
import { DataImportWizard } from '@/components/admin/DataImportWizard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Source system configurations
const IMPORT_SOURCES = [
  { 
    id: 'phorest', 
    name: 'Phorest', 
    description: 'Import from Phorest CSV exports',
    logo: '🍀',
    supported: ['clients', 'appointments', 'services', 'transactions']
  },
  { 
    id: 'mindbody', 
    name: 'Mindbody', 
    description: 'Import from Mindbody exports',
    logo: '💪',
    supported: ['clients', 'appointments', 'transactions']
  },
  { 
    id: 'boulevard', 
    name: 'Boulevard', 
    description: 'Import from Boulevard exports',
    logo: '✨',
    supported: ['clients', 'appointments', 'services']
  },
  { 
    id: 'vagaro', 
    name: 'Vagaro', 
    description: 'Import from Vagaro exports',
    logo: '💈',
    supported: ['clients', 'appointments', 'services']
  },
  { 
    id: 'square', 
    name: 'Square Appointments', 
    description: 'Import from Square exports',
    logo: '⬛',
    supported: ['clients', 'appointments', 'transactions']
  },
  { 
    id: 'csv', 
    name: 'Generic CSV', 
    description: 'Import from custom CSV files with field mapping',
    logo: '📄',
    supported: ['clients', 'appointments', 'services', 'transactions']
  },
];

const DATA_TYPES = [
  { id: 'clients', label: 'Clients', icon: Users, description: 'Customer profiles and contact info' },
  { id: 'appointments', label: 'Appointments', icon: Calendar, description: 'Booking history and schedule' },
  { id: 'services', label: 'Services', icon: Scissors, description: 'Service catalog and pricing' },
  { id: 'transactions', label: 'Transactions', icon: DollarSign, description: 'Sales and payment history' },
];

export default function DataImport() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedDataType, setSelectedDataType] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Fetch import history
  const { data: importJobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ['import-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  const handleStartImport = (source: string, dataType: string) => {
    setSelectedSource(source);
    setSelectedDataType(dataType);
    setWizardOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-amber-500';
      default: return 'bg-muted';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl lg:text-4xl mb-2">DATA IMPORT</h1>
          <p className="text-muted-foreground">
            Migrate your data from other salon software or import from CSV files.
          </p>
        </div>

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              Import Data
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Import History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            {/* Step 1: Select Source */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                  Select Import Source
                </CardTitle>
                <CardDescription>
                  Choose where your data is coming from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {IMPORT_SOURCES.map((source) => (
                    <Card
                      key={source.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        selectedSource === source.id && "border-primary ring-2 ring-primary/20"
                      )}
                      onClick={() => setSelectedSource(source.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <span className="text-4xl mb-3 block">{source.logo}</span>
                        <p className="font-medium text-sm">{source.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Select Data Type */}
            {selectedSource && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                    Select Data Type
                  </CardTitle>
                  <CardDescription>
                    Choose what type of data you want to import
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {DATA_TYPES.map((type) => {
                      const source = IMPORT_SOURCES.find(s => s.id === selectedSource);
                      const isSupported = source?.supported.includes(type.id);
                      const Icon = type.icon;
                      
                      return (
                        <Card
                          key={type.id}
                          className={cn(
                            "transition-all",
                            isSupported ? "cursor-pointer hover:border-primary" : "opacity-50 cursor-not-allowed",
                            selectedDataType === type.id && isSupported && "border-primary ring-2 ring-primary/20"
                          )}
                          onClick={() => isSupported && setSelectedDataType(type.id)}
                        >
                          <CardContent className="p-4">
                            <Icon className="w-8 h-8 mb-2 text-primary" />
                            <p className="font-medium">{type.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                            {!isSupported && (
                              <Badge variant="outline" className="mt-2 text-xs">Not Available</Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Start Import */}
            {selectedSource && selectedDataType && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                    Upload & Configure
                  </CardTitle>
                  <CardDescription>
                    Upload your file and map the fields
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileSpreadsheet className="w-10 h-10 text-primary" />
                      <div>
                        <p className="font-medium">
                          Import {DATA_TYPES.find(t => t.id === selectedDataType)?.label} from {IMPORT_SOURCES.find(s => s.id === selectedSource)?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Upload your CSV file to begin the import process
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => handleStartImport(selectedSource, selectedDataType)}>
                      Start Import
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Recent Imports
                </CardTitle>
                <CardDescription>
                  View the status and results of previous data imports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : importJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No imports yet. Start your first import above.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {importJobs.map((job) => {
                      const progressPercent = job.total_rows ? Math.round((job.processed_rows / job.total_rows) * 100) : 0;
                      
                      return (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("w-3 h-3 rounded-full", getStatusColor(job.status))} />
                            <div>
                              <p className="font-medium capitalize">
                                {job.entity_type} from {job.source_type}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(job.created_at), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {job.status === 'processing' && (
                              <div className="w-32">
                                <Progress value={progressPercent} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-1 text-right">
                                  {progressPercent}%
                                </p>
                              </div>
                            )}
                            {job.status === 'completed' && (
                              <div className="text-right">
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    {job.success_count} imported
                                  </span>
                                </div>
                                {job.error_count > 0 && (
                                  <p className="text-xs text-amber-600">
                                    {job.error_count} failed
                                  </p>
                                )}
                              </div>
                            )}
                            {job.status === 'failed' && (
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">Failed</span>
                              </div>
                            )}
                            <Badge variant="outline" className="capitalize">
                              {job.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Import Wizard Modal */}
        <DataImportWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          sourceType={selectedSource || 'csv'}
          dataType={selectedDataType || 'clients'}
        />
      </div>
    </DashboardLayout>
  );
}
