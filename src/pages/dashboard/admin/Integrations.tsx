import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { 
  Link2, 
  Plus, 
  Pause, 
  Play, 
  Trash2, 
  Settings, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
} from 'lucide-react';
import { usePhorestConnection } from '@/hooks/usePhorestSync';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'connected' | 'paused' | 'not_connected';
  configPath?: string;
  features: string[];
  available: boolean;
}

export default function Integrations() {
  const navigate = useNavigate();
  const { data: phorestConnection, isLoading: phorestLoading } = usePhorestConnection();
  const [pausedIntegrations, setPausedIntegrations] = useState<Set<string>>(new Set());

  const getPhorestStatus = (): 'connected' | 'paused' | 'not_connected' => {
    if (pausedIntegrations.has('phorest')) return 'paused';
    if (phorestConnection?.connected) return 'connected';
    return 'not_connected';
  };

  const integrations: Integration[] = [
    {
      id: 'phorest',
      name: 'Phorest',
      description: 'Salon management software integration for appointments, staff, and sales data.',
      icon: Link2,
      status: getPhorestStatus(),
      configPath: '/dashboard/admin/phorest',
      features: ['Staff Sync', 'Appointments', 'Sales Data', 'Performance Reports'],
      available: true,
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Sync appointments and meetings with Google Calendar.',
      icon: Calendar,
      status: 'not_connected',
      features: ['Calendar Sync', 'Meeting Reminders', 'Availability'],
      available: false,
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Process payments and manage transactions.',
      icon: DollarSign,
      status: 'not_connected',
      features: ['Payment Processing', 'Invoicing', 'Subscriptions'],
      available: false,
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Email marketing and client communication.',
      icon: Users,
      status: 'not_connected',
      features: ['Email Campaigns', 'Audience Management', 'Automation'],
      available: false,
    },
  ];

  const handlePauseIntegration = (integrationId: string) => {
    setPausedIntegrations(prev => {
      const next = new Set(prev);
      if (next.has(integrationId)) {
        next.delete(integrationId);
      } else {
        next.add(integrationId);
      }
      return next;
    });
  };

  const handleRemoveIntegration = (integrationId: string) => {
    // For now, just redirect to the config page
    // In a real implementation, this would disconnect the integration
    const integration = integrations.find(i => i.id === integrationId);
    if (integration?.configPath) {
      navigate(integration.configPath);
    }
  };

  const getStatusBadge = (status: 'connected' | 'paused' | 'not_connected') => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Connected
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="secondary" className="gap-1">
            <Pause className="w-3 h-3" />
            Paused
          </Badge>
        );
      case 'not_connected':
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <XCircle className="w-3 h-3" />
            Not Connected
          </Badge>
        );
    }
  };

  const connectedIntegrations = integrations.filter(i => i.status === 'connected' || i.status === 'paused');
  const availableIntegrations = integrations.filter(i => i.status === 'not_connected' && i.available);
  const comingSoonIntegrations = integrations.filter(i => !i.available);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl mb-2">INTEGRATIONS</h1>
            <p className="text-muted-foreground font-sans">
              Manage third-party integrations and connected services.
            </p>
          </div>
        </div>

        {/* Connected Integrations */}
        <div className="space-y-4">
          <h2 className="font-display text-xl tracking-wide">Active Integrations</h2>
          {connectedIntegrations.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No integrations connected yet.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {connectedIntegrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <Card key={integration.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-display">{integration.name}</CardTitle>
                            {getStatusBadge(integration.status)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {integration.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        {integration.configPath && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(integration.configPath!)}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePauseIntegration(integration.id)}
                        >
                          {integration.status === 'paused' ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          )}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Integration</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove the {integration.name} integration? 
                                This will disconnect all synced data and stop automatic updates.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveIntegration(integration.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Integrations */}
        {availableIntegrations.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl tracking-wide">Available Integrations</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableIntegrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <Card key={integration.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-lg font-display">{integration.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {integration.features.slice(0, 3).map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      <Button className="w-full" onClick={() => integration.configPath && navigate(integration.configPath)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Coming Soon */}
        {comingSoonIntegrations.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl tracking-wide text-muted-foreground">Coming Soon</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {comingSoonIntegrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <Card key={integration.id} className="overflow-hidden opacity-60">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-display">{integration.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1">Coming Soon</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
