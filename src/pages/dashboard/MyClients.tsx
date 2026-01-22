import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  Star, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowUpDown,
  Loader2,
  UserCheck,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { PhorestSyncButton } from '@/components/dashboard/PhorestSyncButton';

interface ClientData {
  name: string;
  totalSpend: number;
  visitCount: number;
  lastVisit: string;
  firstVisit: string;
  averageSpend: number;
  isVip: boolean;
  isAtRisk: boolean;
  daysSinceVisit: number;
  topServices: string[];
}

type SortField = 'totalSpend' | 'visitCount' | 'lastVisit' | 'name';
type SortDirection = 'asc' | 'desc';

export default function MyClients() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalSpend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeTab, setActiveTab] = useState('all');

  const today = new Date();
  const sixtyDaysAgo = format(subDays(today, 60), 'yyyy-MM-dd');

  // Fetch all transactions for this stylist
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['my-clients-full', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phorest_sales_transactions')
        .select('client_name, total_amount, transaction_date, item_name, item_type')
        .eq('stylist_user_id', user?.id)
        .not('client_name', 'is', null)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Process client data
  const clients = useMemo(() => {
    if (!transactions) return [];

    const clientMap: Record<string, ClientData> = {};

    transactions.forEach(tx => {
      const name = tx.client_name || 'Unknown';
      if (!clientMap[name]) {
        clientMap[name] = {
          name,
          totalSpend: 0,
          visitCount: 0,
          lastVisit: tx.transaction_date,
          firstVisit: tx.transaction_date,
          averageSpend: 0,
          isVip: false,
          isAtRisk: false,
          daysSinceVisit: 0,
          topServices: [],
        };
      }
      
      clientMap[name].totalSpend += Number(tx.total_amount) || 0;
      clientMap[name].visitCount += 1;
      
      if (tx.transaction_date > clientMap[name].lastVisit) {
        clientMap[name].lastVisit = tx.transaction_date;
      }
      if (tx.transaction_date < clientMap[name].firstVisit) {
        clientMap[name].firstVisit = tx.transaction_date;
      }
      
      // Track services
      if (tx.item_type === 'service' && tx.item_name) {
        if (!clientMap[name].topServices.includes(tx.item_name)) {
          clientMap[name].topServices.push(tx.item_name);
        }
      }
    });

    // Calculate stats and status
    const allClients = Object.values(clientMap);
    const avgSpend = allClients.reduce((s, c) => s + c.totalSpend, 0) / allClients.length || 0;
    
    allClients.forEach(client => {
      client.averageSpend = client.visitCount > 0 ? client.totalSpend / client.visitCount : 0;
      client.daysSinceVisit = differenceInDays(today, new Date(client.lastVisit));
      client.isVip = client.totalSpend > avgSpend * 1.5 || client.visitCount >= 4;
      client.isAtRisk = client.visitCount >= 2 && client.lastVisit < sixtyDaysAgo;
      client.topServices = client.topServices.slice(0, 3);
    });

    return allClients;
  }, [transactions, sixtyDaysAgo, today]);

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Tab filter
    if (activeTab === 'vip') {
      filtered = filtered.filter(c => c.isVip);
    } else if (activeTab === 'at-risk') {
      filtered = filtered.filter(c => c.isAtRisk);
    } else if (activeTab === 'new') {
      filtered = filtered.filter(c => c.visitCount === 1);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'totalSpend':
          comparison = a.totalSpend - b.totalSpend;
          break;
        case 'visitCount':
          comparison = a.visitCount - b.visitCount;
          break;
        case 'lastVisit':
          comparison = new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [clients, activeTab, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: clients.length,
    vip: clients.filter(c => c.isVip).length,
    atRisk: clients.filter(c => c.isAtRisk).length,
    newClients: clients.filter(c => c.visitCount === 1).length,
    totalRevenue: clients.reduce((s, c) => s + c.totalSpend, 0),
  }), [clients]);

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
          <PhorestSyncButton syncType="sales" />
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
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('totalSpend')}
                  className={cn("text-xs", sortField === 'totalSpend' && "bg-muted")}
                >
                  <DollarSign className="w-3 h-3 mr-1" />
                  Spend
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('visitCount')}
                  className={cn("text-xs", sortField === 'visitCount' && "bg-muted")}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Visits
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('lastVisit')}
                  className={cn("text-xs", sortField === 'lastVisit' && "bg-muted")}
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
                  {searchQuery ? 'No clients match your search.' : 'No client data available yet.'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredClients.map((client, idx) => (
                  <div key={client.name} className="py-4 flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="font-display text-sm bg-primary/10">
                        {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{client.name}</p>
                        {client.isVip && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 text-xs">
                            <Star className="w-3 h-3 mr-1" /> VIP
                          </Badge>
                        )}
                        {client.isAtRisk && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" /> At Risk
                          </Badge>
                        )}
                        {client.visitCount === 1 && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            New
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{client.visitCount} visits</span>
                        <span>•</span>
                        <span>Avg ${client.averageSpend.toLocaleString()}</span>
                        <span>•</span>
                        <span>Last: {format(new Date(client.lastVisit), 'MMM d, yyyy')}</span>
                        {client.daysSinceVisit > 30 && (
                          <>
                            <span>•</span>
                            <span className={cn(
                              client.daysSinceVisit > 60 ? "text-red-600" : "text-amber-600"
                            )}>
                              {client.daysSinceVisit} days ago
                            </span>
                          </>
                        )}
                      </div>
                      {client.topServices.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {client.topServices.map(service => (
                            <Badge key={service} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="font-display text-lg">${client.totalSpend.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">lifetime</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
