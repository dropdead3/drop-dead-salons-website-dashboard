import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  usePhorestConnection,
  usePhorestSyncLogs,
  usePhorestStaffMappings,
  useTriggerPhorestSync,
  useCreateStaffMapping,
  useDeleteStaffMapping,
  PhorestStaffMember,
} from '@/hooks/usePhorestSync';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Link2,
  Unlink,
  Clock,
  Users,
  Calendar,
  BarChart3,
  Loader2,
  Trash2,
  Wand2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function PhorestSettings() {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPhorestStaff, setSelectedPhorestStaff] = useState<PhorestStaffMember | null>(null);
  

  const { data: connection, isLoading: connectionLoading, refetch: refetchConnection } = usePhorestConnection();
  const { data: syncLogs, isLoading: logsLoading } = usePhorestSyncLogs();
  const { data: staffMappings, isLoading: mappingsLoading } = usePhorestStaffMappings();
  
  const triggerSync = useTriggerPhorestSync();
  const createMapping = useCreateStaffMapping();
  const deleteMapping = useDeleteStaffMapping();

  // Fetch employees for mapping
  const { data: employees } = useQuery({
    queryKey: ['employees-for-mapping'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, email')
        .eq('is_approved', true)
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  // Get employees not yet mapped
  const mappedUserIds = new Set(staffMappings?.map((m: any) => m.user_id) || []);
  const unmappedEmployees = employees?.filter(e => !mappedUserIds.has(e.user_id)) || [];

  // Get Phorest staff not yet mapped
  const mappedPhorestIds = new Set(staffMappings?.map((m: any) => m.phorest_staff_id) || []);
  const phorestStaffList = connection?.staff_list || [];
  const unmappedPhorestStaff = phorestStaffList.filter(s => !mappedPhorestIds.has(s.id));

  // Auto-match suggestions based on name similarity
  const getAutoMatchSuggestions = () => {
    const suggestions: Array<{ employee: typeof employees[0]; phorestStaff: PhorestStaffMember; confidence: 'high' | 'medium' }> = [];
    
    unmappedEmployees.forEach(emp => {
      const empName = (emp.display_name || emp.full_name || '').toLowerCase().trim();
      
      unmappedPhorestStaff.forEach(staff => {
        const staffName = staff.name.toLowerCase().trim();
        
        // Exact match
        if (empName === staffName) {
          suggestions.push({ employee: emp, phorestStaff: staff, confidence: 'high' });
        } else {
          // Partial match (first name or last name)
          const empParts = empName.split(' ');
          const staffParts = staffName.split(' ');
          
          const hasFirstNameMatch = empParts[0] && staffParts[0] && empParts[0] === staffParts[0];
          const hasLastNameMatch = empParts.length > 1 && staffParts.length > 1 && 
            empParts[empParts.length - 1] === staffParts[staffParts.length - 1];
          
          if (hasFirstNameMatch && hasLastNameMatch) {
            suggestions.push({ employee: emp, phorestStaff: staff, confidence: 'high' });
          } else if (hasFirstNameMatch || hasLastNameMatch) {
            suggestions.push({ employee: emp, phorestStaff: staff, confidence: 'medium' });
          }
        }
      });
    });
    
    return suggestions;
  };

  const autoMatchSuggestions = getAutoMatchSuggestions();

  const handleCreateMapping = async () => {
    if (!selectedUserId || !selectedPhorestStaff) {
      toast({
        title: 'Missing fields',
        description: 'Please select both a team member and a Phorest staff member.',
        variant: 'destructive',
      });
      return;
    }

    await createMapping.mutateAsync({
      user_id: selectedUserId,
      phorest_staff_id: selectedPhorestStaff.id,
      phorest_staff_name: selectedPhorestStaff.name,
    });

    setSelectedUserId('');
    setSelectedPhorestStaff(null);
  };

  const handleAutoMatch = async (employee: typeof employees[0], phorestStaff: PhorestStaffMember) => {
    await createMapping.mutateAsync({
      user_id: employee.user_id,
      phorest_staff_id: phorestStaff.id,
      phorest_staff_name: phorestStaff.name,
    });
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSyncTypeIcon = (type: string) => {
    switch (type) {
      case 'staff':
        return <Users className="w-4 h-4" />;
      case 'appointments':
        return <Calendar className="w-4 h-4" />;
      case 'reports':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  const lastSync = syncLogs?.find(log => log.status === 'success');

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl mb-2">PHOREST INTEGRATION</h1>
            <p className="text-muted-foreground font-sans">
              Manage Phorest API connection and data synchronization.
            </p>
          </div>
          <Button
            onClick={() => refetchConnection()}
            variant="outline"
            disabled={connectionLoading}
          >
            {connectionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">Test Connection</span>
          </Button>
        </div>

        {/* Connection Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {connectionLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              ) : connection?.connected ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h2 className="font-display text-xl">
                  {connectionLoading 
                    ? 'Checking connection...' 
                    : connection?.connected 
                      ? 'Connected to Phorest' 
                      : 'Not Connected'}
                </h2>
                {connection?.connected && connection.business && (
                  <p className="text-muted-foreground">
                    {connection.business.name} • {connection.staff_count || 0} staff members
                  </p>
                )}
                {!connection?.connected && connection?.error && (
                  <p className="text-red-500 text-sm">{connection.error}</p>
                )}
              </div>
            </div>
            {lastSync && (
              <div className="text-right text-sm text-muted-foreground">
                <p>Last synced</p>
                <p className="font-medium text-foreground">
                  {formatDistanceToNow(new Date(lastSync.completed_at!), { addSuffix: true })}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Sync Actions */}
        {connection?.connected && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-display text-sm">Staff</h3>
              </div>
              <Button
                onClick={() => triggerSync.mutate('staff')}
                disabled={triggerSync.isPending}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {triggerSync.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sync Staff'}
              </Button>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-display text-sm">Appointments</h3>
              </div>
              <Button
                onClick={() => triggerSync.mutate('appointments')}
                disabled={triggerSync.isPending}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {triggerSync.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sync Appointments'}
              </Button>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-display text-sm">Reports</h3>
              </div>
              <Button
                onClick={() => triggerSync.mutate('reports')}
                disabled={triggerSync.isPending}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {triggerSync.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sync Reports'}
              </Button>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="w-5 h-5 text-primary" />
                <h3 className="font-display text-sm">Full Sync</h3>
              </div>
              <Button
                onClick={() => triggerSync.mutate('all')}
                disabled={triggerSync.isPending}
                size="sm"
                className="w-full"
              >
                {triggerSync.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sync All'}
              </Button>
            </Card>
          </div>
        )}

        {/* Tabs for Staff Mapping and Sync Logs */}
        <Tabs defaultValue="mapping" className="space-y-6">
          <TabsList>
            <TabsTrigger value="mapping" className="font-display">
              <Link2 className="w-4 h-4 mr-2" />
              Staff Mapping
            </TabsTrigger>
            <TabsTrigger value="logs" className="font-display">
              <Clock className="w-4 h-4 mr-2" />
              Sync History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mapping">
            <Card className="p-6">
              <h3 className="font-display text-lg mb-4">Link Team Members to Phorest Staff</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Map your dashboard team members to their Phorest staff profiles to sync their performance data.
              </p>

              {/* Auto-Match Suggestions */}
              {autoMatchSuggestions.length > 0 && (
                <div className="mb-8 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="w-5 h-5 text-primary" />
                    <h4 className="font-display text-sm">Suggested Matches</h4>
                    <Badge variant="secondary">{autoMatchSuggestions.length} found</Badge>
                  </div>
                  <div className="space-y-2">
                    {autoMatchSuggestions.slice(0, 5).map((suggestion, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-md">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">
                            {suggestion.employee.display_name || suggestion.employee.full_name}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span>{suggestion.phorestStaff.name}</span>
                          <Badge variant={suggestion.confidence === 'high' ? 'default' : 'secondary'}>
                            {suggestion.confidence === 'high' ? 'Exact Match' : 'Partial Match'}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAutoMatch(suggestion.employee, suggestion.phorestStaff)}
                          disabled={createMapping.isPending}
                        >
                          {createMapping.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Link2 className="w-4 h-4" />
                          )}
                          <span className="ml-2">Link</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Mapping */}
              <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-muted rounded-lg">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {unmappedEmployees.map((emp) => (
                      <SelectItem key={emp.user_id} value={emp.user_id}>
                        {emp.display_name || emp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={selectedPhorestStaff?.id || ''} 
                  onValueChange={(id) => {
                    const staff = unmappedPhorestStaff.find(s => s.id === id);
                    setSelectedPhorestStaff(staff || null);
                  }}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Select Phorest staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {unmappedPhorestStaff.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        {phorestStaffList.length === 0 
                          ? 'Test connection to load staff' 
                          : 'All staff are mapped'}
                      </SelectItem>
                    ) : (
                      unmappedPhorestStaff.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.id})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleCreateMapping}
                  disabled={createMapping.isPending || !selectedUserId || !selectedPhorestStaff}
                >
                  {createMapping.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  <span className="ml-2">Link</span>
                </Button>
              </div>

              {/* Existing Mappings */}
              {mappingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : staffMappings?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Unlink className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No staff mappings yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Phorest Staff ID</TableHead>
                      <TableHead>Phorest Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffMappings?.map((mapping: any) => (
                      <TableRow key={mapping.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {mapping.employee_profiles?.display_name || mapping.employee_profiles?.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {mapping.employee_profiles?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {mapping.phorest_staff_id}
                        </TableCell>
                        <TableCell>
                          {mapping.phorest_staff_name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={mapping.is_active ? 'default' : 'secondary'}>
                            {mapping.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMapping.mutate(mapping.id)}
                            disabled={deleteMapping.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="p-6">
              <h3 className="font-display text-lg mb-4">Sync History</h3>
              
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : syncLogs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No sync history yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSyncTypeIcon(log.sync_type)}
                            <span className="capitalize">{log.sync_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSyncStatusIcon(log.status)}
                            <span className="capitalize">{log.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>{log.records_synced}</TableCell>
                        <TableCell>
                          {format(new Date(log.started_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          {log.completed_at 
                            ? format(new Date(log.completed_at), 'MMM d, HH:mm')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {log.error_message ? (
                            <span className="text-destructive text-sm truncate max-w-xs block">
                              {log.error_message}
                            </span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
