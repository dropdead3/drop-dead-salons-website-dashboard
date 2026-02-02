import { format, differenceInDays } from 'date-fns';
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
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisitHistoryTimeline } from './VisitHistoryTimeline';
import { ClientNotesSection } from './ClientNotesSection';
import { useClientVisitHistory } from '@/hooks/useClientVisitHistory';
import { BannedClientAlert } from './clients/BannedClientAlert';
import { BannedClientBadge } from './clients/BannedClientBadge';
import { BanClientToggle } from './clients/BanClientToggle';

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
}

interface ClientDetailSheetProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationName?: string;
}

export function ClientDetailSheet({ client, open, onOpenChange, locationName }: ClientDetailSheetProps) {
  const { data: visitHistory, isLoading: historyLoading } = useClientVisitHistory(client?.phorest_client_id);

  if (!client) return null;

  const initials = client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {/* Banned Client Alert */}
        {client.is_banned && (
          <div className="mb-4">
            <BannedClientAlert reason={client.ban_reason} />
          </div>
        )}

        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="font-display text-xl bg-primary/10">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="font-display text-xl flex items-center gap-2 flex-wrap">
                {client.name}
                {client.is_banned && <BannedClientBadge size="md" />}
                {client.is_vip && !client.is_banned && (
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
          </div>
          {/* Ban/Unban Toggle for admins */}
          <div className="mt-3">
            <BanClientToggle
              clientId={client.id}
              clientName={client.name}
              isBanned={client.is_banned || false}
              banReason={client.ban_reason}
            />
          </div>
        </SheetHeader>

        {/* Contact Quick Actions */}
        <div className="flex gap-2 py-4 border-b">
          {client.phone && (
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a href={`tel:${client.phone}`}>
                <Phone className="w-4 h-4 mr-2" />
                Call
              </a>
            </Button>
          )}
          {client.email && (
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a href={`mailto:${client.email}`}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </a>
            </Button>
          )}
          {client.phone && (
            <Button variant="outline" size="sm" asChild className="flex-1">
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
            <p className="font-display text-lg">${(client.total_spend || 0).toLocaleString()}</p>
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
            <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
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
                <span>Last visit: {format(new Date(client.last_visit), 'MMM d, yyyy')}</span>
              </div>
            )}
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
