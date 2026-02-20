import { useState } from 'react';
import { differenceInDays } from 'date-fns';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Star, 
  AlertTriangle, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin,
  MessageSquare,
  Clock,
  TrendingUp,
  Cake,
  Award,
  Pencil,
  X,
  Check,
  Loader2,
  Archive
} from 'lucide-react';
import { tokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { VisitHistoryTimeline } from './VisitHistoryTimeline';
import { ClientNotesSection } from './ClientNotesSection';
import { useClientVisitHistory } from '@/hooks/useClientVisitHistory';
import { BannedClientAlert } from './clients/BannedClientAlert';
import { BannedClientBadge } from './clients/BannedClientBadge';
import { BanClientToggle } from './clients/BanClientToggle';
import { ArchiveClientToggle } from './clients/ArchiveClientToggle';
import { ClientMarketingStatus } from './clients/ClientMarketingStatus';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { toast } from 'sonner';

interface Client {
  id: string;
  phorest_client_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  is_vip: boolean;
  visit_count: number;
  total_spend: number | null;
  last_visit: string | null;
  preferred_services: string[] | null;
  branch_name: string | null;
  location_id: string | null;
  isAtRisk?: boolean;
  isNew?: boolean;
  daysSinceVisit?: number | null;
  is_banned?: boolean;
  ban_reason?: string | null;
  birthday?: string | null;
  client_since?: string | null;
  is_archived?: boolean;
}

interface ClientDetailSheetProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationName?: string;
}

export function ClientDetailSheet({ client, open, onOpenChange, locationName }: ClientDetailSheetProps) {
  const { data: visitHistory, isLoading: historyLoading } = useClientVisitHistory(client?.phorest_client_id);
  const { formatCurrencyWhole } = useFormatCurrency();
  const { formatDate } = useFormatDate();
  const { roles } = useAuth();
  const { selectedOrganization } = useOrganizationContext();
  const queryClient = useQueryClient();

  // Contact edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Dates edit mode state (independent)
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editBirthday, setEditBirthday] = useState('');
  const [editClientSince, setEditClientSince] = useState('');
  
  const canEdit = roles.some(role => ['admin', 'manager', 'super_admin', 'receptionist'].includes(role));

  const startEditing = () => {
    if (!client) return;
    setEditName(client.name || '');
    setEditEmail(client.email || '');
    setEditPhone(client.phone || '');
    setIsEditing(true);
  };

  const startEditingDates = () => {
    if (!client) return;
    setEditBirthday(client.birthday || '');
    setEditClientSince(client.client_since || '');
    setIsEditingDates(true);
  };

  const cancelEditing = () => setIsEditing(false);
  const cancelEditingDates = () => setIsEditingDates(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('No client');
      const [firstName, ...rest] = editName.trim().split(' ');
      const lastName = rest.join(' ');
      
      const { error } = await supabase
        .from('phorest_clients')
        .update({
          first_name: firstName,
          last_name: lastName || null,
          name: editName.trim(),
          email: editEmail.trim() || null,
          phone: editPhone.trim() || null,
        })
        .eq('id', client.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-directory'] });
      queryClient.invalidateQueries({ queryKey: ['phorest-clients'] });
      toast.success('Client info updated');
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to update client', { description: error.message });
    },
  });

  const saveDatesMutation = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('No client');
      
      const { error } = await supabase
        .from('phorest_clients')
        .update({
          birthday: editBirthday || null,
          client_since: editClientSince || null,
        })
        .eq('id', client.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-directory'] });
      queryClient.invalidateQueries({ queryKey: ['phorest-clients'] });
      toast.success('Dates updated');
      setIsEditingDates(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to update dates', { description: error.message });
    },
  });

  if (!client) return null;

  const initials = client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { setIsEditing(false); setIsEditingDates(false); } onOpenChange(o); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {/* Banned Client Alert */}
        {client.is_banned && (
          <div className="mb-4">
            <BannedClientAlert reason={client.ban_reason} />
          </div>
        )}

        {/* Archived Alert */}
        {client.is_archived && (
          <div className="mb-4 p-3 rounded-lg bg-muted border border-border flex items-center gap-2">
            <Archive className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">This client is archived. Marketing is paused.</span>
          </div>
        )}

        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-4">
            <Avatar className={cn("w-16 h-16", client.is_archived && "opacity-50")}>
              <AvatarFallback className="font-display text-xl bg-primary/10">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="font-display text-xl flex items-center gap-2 flex-wrap">
                {client.name}
                {client.is_banned && <BannedClientBadge size="md" />}
                {client.is_archived && (
                  <Badge variant="secondary" className="text-xs">
                    <Archive className="w-3 h-3 mr-1" /> Archived
                  </Badge>
                )}
                {client.is_vip && !client.is_banned && !client.is_archived && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                    <Star className="w-3 h-3 mr-1" /> VIP
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription className="flex flex-wrap gap-2 mt-1">
                {client.isAtRisk && !client.is_banned && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" /> At Risk
                  </Badge>
                )}
                {client.isNew && !client.is_banned && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                    New Client
                  </Badge>
                )}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-1">
              <ArchiveClientToggle
                clientId={client.id}
                clientName={client.name}
                isArchived={client.is_archived || false}
              />
              <BanClientToggle
                clientId={client.id}
                clientName={client.name}
                isBanned={client.is_banned || false}
                banReason={client.ban_reason}
              />
            </div>
          </div>
        </SheetHeader>

        {/* Contact Quick Actions */}
        <div className="flex gap-2 py-4 border-b">
          {client.phone && (
            <Button variant="outline" size={tokens.button.card} asChild className="flex-1">
              <a href={`tel:${client.phone}`}>
                <Phone className="w-4 h-4 mr-2" />
                Call
              </a>
            </Button>
          )}
          {client.email && (
            <Button variant="outline" size={tokens.button.card} asChild className="flex-1">
              <a href={`mailto:${client.email}`}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </a>
            </Button>
          )}
          {client.phone && (
            <Button variant="outline" size={tokens.button.card} asChild className="flex-1">
              <a href={`sms:${client.phone}`}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Text
              </a>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 py-4">
          <Card className="p-3 text-center">
            <Calendar className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="font-display text-lg">{client.visit_count}</p>
            <p className="text-xs text-muted-foreground">Visits</p>
          </Card>
          <Card className="p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="font-display text-lg">{formatCurrencyWhole(client.total_spend || 0)}</p>
            <p className="text-xs text-muted-foreground">Total Spend</p>
          </Card>
          <Card className="p-3 text-center">
            <Clock className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className={cn(
              "font-display text-lg",
              client.daysSinceVisit && client.daysSinceVisit > 60 && "text-red-600",
              client.daysSinceVisit && client.daysSinceVisit > 30 && client.daysSinceVisit <= 60 && "text-amber-600"
            )}>
              {client.daysSinceVisit !== null ? `${client.daysSinceVisit}d` : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Since Visit</p>
          </Card>
        </div>

        {/* Contact Info */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
              {canEdit && !isEditing && (
                <Button variant="ghost" size="sm" onClick={startEditing} className="h-7 px-2">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
              {isEditing && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={cancelEditing} className="h-7 px-2 text-muted-foreground">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => saveMutation.mutate()} 
                    disabled={saveMutation.isPending}
                    className="h-7 px-2 text-green-600"
                  >
                    {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}
            </div>
            {isEditing && (
              <p className="text-xs text-muted-foreground mt-1">
                Changes are saved locally and won't sync back to Phorest.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <Input type="email" autoCapitalize="none" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <Input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            ) : (
              <>
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {(locationName || client.branch_name) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{locationName || client.branch_name}</span>
                  </div>
                )}
                {client.last_visit && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Last visit: {formatDate(new Date(client.last_visit), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Important Dates */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-medium">Important Dates</CardTitle>
              </div>
              {canEdit && !isEditingDates && (
                <Button variant="ghost" size="sm" onClick={startEditingDates} className="h-7 px-2">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
              {isEditingDates && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={cancelEditingDates} className="h-7 px-2 text-muted-foreground">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => saveDatesMutation.mutate()} 
                    disabled={saveDatesMutation.isPending}
                    className="h-7 px-2 text-green-600"
                  >
                    {saveDatesMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isEditingDates ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Birthday</label>
                  <Input type="date" value={editBirthday} onChange={(e) => setEditBirthday(e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Client Since</label>
                  <Input type="date" value={editClientSince} onChange={(e) => setEditClientSince(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Cake className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {client.birthday 
                      ? `Birthday: ${formatDate(new Date(client.birthday + 'T00:00:00'), 'MMM d')}`
                      : 'No birthday on file'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {client.client_since ? (
                      <>
                        Client since {formatDate(new Date(client.client_since + 'T00:00:00'), 'MMM yyyy')}
                        {' — '}
                        {(() => {
                          const years = differenceInDays(new Date(), new Date(client.client_since + 'T00:00:00')) / 365;
                          if (years >= 1) return `${Math.floor(years)} year${Math.floor(years) !== 1 ? 's' : ''}`;
                          const months = Math.floor(differenceInDays(new Date(), new Date(client.client_since + 'T00:00:00')) / 30);
                          return `${months} month${months !== 1 ? 's' : ''}`;
                        })()}
                      </>
                    ) : 'No start date on file'}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Marketing Preferences */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <ClientMarketingStatus 
              clientId={client.id} 
              organizationId={selectedOrganization?.id} 
            />
          </CardContent>
        </Card>

        {/* Preferred Services */}
        {client.preferred_services && client.preferred_services.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Preferred Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {client.preferred_services.map(service => (
                  <Badge key={service} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for History and Notes */}
        <Tabs defaultValue="history" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="history" className="flex-1">Visit History</TabsTrigger>
            <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="mt-4">
            <VisitHistoryTimeline 
              visits={visitHistory || []} 
              isLoading={historyLoading} 
            />
          </TabsContent>
          
          <TabsContent value="notes" className="mt-4">
            <ClientNotesSection clientId={client.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
