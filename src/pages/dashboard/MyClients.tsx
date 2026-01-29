import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Star, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  ArrowUpDown,
  Loader2,
  UserCheck,
  Clock,
  Mail,
  Phone,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { PhorestSyncButton } from '@/components/dashboard/PhorestSyncButton';
import { useLocations } from '@/hooks/useLocations';
import { ClientDetailSheet } from '@/components/dashboard/ClientDetailSheet';

type SortField = 'total_spend' | 'visit_count' | 'last_visit' | 'name';
type SortDirection = 'asc' | 'desc';

export default function MyClients() {
  const { user, roles } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('total_spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Determine if user can see all clients (leadership + front desk)
  const canViewAllClients = roles.some(role => 
    ['admin', 'manager', 'super_admin', 'receptionist'].includes(role)
  );

  // Fetch locations for the filter dropdown
  const { data: locations } = useLocations();

  // Fetch clients from the dedicated phorest_clients table
  const { data: clients, isLoading } = useQuery({
    queryKey: ['my-clients-full', user?.id, canViewAllClients],
    queryFn: async () => {
      let query = supabase
        .from('phorest_clients')
        .select('*')
        .order('total_spend', { ascending: false });

      // Only filter by preferred_stylist_id for stylists
      if (!canViewAllClients) {
        query = query.eq('preferred_stylist_id', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Process clients with derived fields
  const processedClients = useMemo(() => {
    if (!clients) return [];
    
    const today = new Date();
    
    return clients.map(client => {
      const daysSinceVisit = client.last_visit 
        ? differenceInDays(today, new Date(client.last_visit))
        : null;
      
      // At-risk: 2+ visits but no visit in 60+ days
      const isAtRisk = (client.visit_count >= 2) && daysSinceVisit !== null && daysSinceVisit >= 60;
      
      // New client: only 1 visit
      const isNew = client.visit_count === 1;
      
      return {
        ...client,
        daysSinceVisit,
        isAtRisk,
        isNew,
      };
    });
  }, [clients]);

  // Get unique locations from client data for the filter
  const clientLocations = useMemo(() => {
    if (!processedClients) return [];
    
    const locationMap = new Map<string, { id: string; name: string }>();
    
    processedClients.forEach(client => {
      if (client.location_id) {
        const loc = locations?.find(l => l.id === client.location_id);
        locationMap.set(client.location_id, {
          id: client.location_id,
          name: loc?.name || client.branch_name || client.location_id
        });
      } else if (client.branch_name) {
        // Fallback to branch_name if no location_id
        locationMap.set(client.branch_name, {
          id: client.branch_name,
          name: client.branch_name
        });
      }
    });
    
    return Array.from(locationMap.values());
  }, [processedClients, locations]);

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let filtered = processedClients;

    // Location filter
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(c => 
        c.location_id === selectedLocation || c.branch_name === selectedLocation
      );
    }

    // Tab filter
    if (activeTab === 'vip') {
      filtered = filtered.filter(c => c.is_vip);
    } else if (activeTab === 'at-risk') {
      filtered = filtered.filter(c => c.isAtRisk);
    } else if (activeTab === 'new') {
      filtered = filtered.filter(c => c.isNew);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'total_spend':
          comparison = Number(a.total_spend || 0) - Number(b.total_spend || 0);
          break;
        case 'visit_count':
          comparison = (a.visit_count || 0) - (b.visit_count || 0);
          break;
        case 'last_visit':
          const aTime = a.last_visit ? new Date(a.last_visit).getTime() : 0;
          const bTime = b.last_visit ? new Date(b.last_visit).getTime() : 0;
          comparison = aTime - bTime;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [processedClients, selectedLocation, activeTab, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Stats (filtered by location if selected)
  const stats = useMemo(() => {
    const clientsForStats = selectedLocation === 'all' 
      ? processedClients 
      : processedClients.filter(c => c.location_id === selectedLocation || c.branch_name === selectedLocation);
    
    return {
      total: clientsForStats.length,
      vip: clientsForStats.filter(c => c.is_vip).length,
      atRisk: clientsForStats.filter(c => c.isAtRisk).length,
      newClients: clientsForStats.filter(c => c.isNew).length,
      totalRevenue: clientsForStats.reduce((s, c) => s + Number(c.total_spend || 0), 0),
    };
  }, [processedClients, selectedLocation]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl mb-2">MY CLIENTS</h1>
            <p className="text-muted-foreground font-sans">
              Track your client relationships and identify opportunities.
            </p>
          </div>
          <PhorestSyncButton syncType="clients" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="font-display text-2xl">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Clients</p>
          </Card>
          <Card className="p-4 text-center bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
            <Star className="w-5 h-5 text-amber-600 mx-auto mb-2" />
            <p className="font-display text-2xl text-amber-700 dark:text-amber-400">{stats.vip}</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">VIP Clients</p>
          </Card>
          <Card className="p-4 text-center bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-2" />
            <p className="font-display text-2xl text-red-700 dark:text-red-400">{stats.atRisk}</p>
            <p className="text-xs text-red-600 dark:text-red-500">At Risk</p>
          </Card>
          <Card className="p-4 text-center bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
            <UserCheck className="w-5 h-5 text-green-600 mx-auto mb-2" />
            <p className="font-display text-2xl text-green-700 dark:text-green-400">{stats.newClients}</p>
            <p className="text-xs text-green-600 dark:text-green-500">New Clients</p>
          </Card>
          <Card className="p-4 text-center">
            <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="font-display text-2xl">${stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Location Filter */}
          {clientLocations.length > 0 && (
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full md:w-[200px]">
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {clientLocations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="vip" className="text-xs">
                <Star className="w-3 h-3 mr-1" /> VIP
              </TabsTrigger>
              <TabsTrigger value="at-risk" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" /> At Risk
              </TabsTrigger>
              <TabsTrigger value="new" className="text-xs">New</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Client List */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg">
                {filteredClients.length} {activeTab === 'all' ? 'Clients' : activeTab === 'vip' ? 'VIP Clients' : activeTab === 'at-risk' ? 'At-Risk Clients' : 'New Clients'}
                {selectedLocation !== 'all' && (
                  <Badge variant="outline" className="ml-2 font-sans font-normal">
                    <MapPin className="w-3 h-3 mr-1" />
                    {clientLocations.find(l => l.id === selectedLocation)?.name}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('total_spend')}
                  className={cn("text-xs", sortField === 'total_spend' && "bg-muted")}
                >
                  <DollarSign className="w-3 h-3 mr-1" />
                  Spend
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('visit_count')}
                  className={cn("text-xs", sortField === 'visit_count' && "bg-muted")}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Visits
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('last_visit')}
                  className={cn("text-xs", sortField === 'last_visit' && "bg-muted")}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Recent
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No clients match your search.' : 'No client data available yet. Sync with Phorest to populate.'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredClients.map((client) => {
                  const locationName = locations?.find(l => l.id === client.location_id)?.name || client.branch_name;
                  
                  const handleClientClick = () => {
                    setSelectedClient({ ...client });
                    setDetailSheetOpen(true);
                  };

                  return (
                    <div 
                      key={client.id} 
                      className="py-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 -mx-6 px-6 transition-colors"
                      onClick={handleClientClick}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="font-display text-sm bg-primary/10">
                          {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{client.name}</p>
                          {client.is_vip && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 text-xs">
                              <Star className="w-3 h-3 mr-1" /> VIP
                            </Badge>
                          )}
                          {client.isAtRisk && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> At Risk
                            </Badge>
                          )}
                          {client.isNew && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{client.visit_count} visits</span>
                          {client.last_visit && (
                            <>
                              <span>•</span>
                              <span>Last: {format(new Date(client.last_visit), 'MMM d, yyyy')}</span>
                            </>
                          )}
                          {client.daysSinceVisit !== null && client.daysSinceVisit > 30 && (
                            <>
                              <span>•</span>
                              <span className={cn(
                                client.daysSinceVisit > 60 ? "text-red-600" : "text-amber-600"
                              )}>
                                {client.daysSinceVisit} days ago
                              </span>
                            </>
                          )}
                          {locationName && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {locationName}
                              </span>
                            </>
                          )}
                        </div>
                        {/* Contact info & preferred services */}
                        <div className="flex items-center gap-3 mt-1.5">
                          {client.email && (
                            <a href={`mailto:${client.email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {client.email}
                            </a>
                          )}
                          {client.phone && (
                            <a href={`tel:${client.phone}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {client.phone}
                            </a>
                          )}
                        </div>
                        {client.preferred_services && client.preferred_services.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {client.preferred_services.slice(0, 3).map(service => (
                              <Badge key={service} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="font-display text-lg">${Number(client.total_spend || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">lifetime</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Detail Sheet */}
        <ClientDetailSheet
          client={selectedClient}
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
          locationName={locations?.find(l => l.id === selectedClient?.location_id)?.name}
        />
      </div>
    </DashboardLayout>
  );
}
