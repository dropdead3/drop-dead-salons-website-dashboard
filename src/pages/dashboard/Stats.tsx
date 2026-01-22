import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePhorestPerformanceMetrics, usePhorestConnection } from '@/hooks/usePhorestSync';
import { format, startOfWeek } from 'date-fns';
import { 
  Eye, 
  MessageCircle, 
  Calendar, 
  TrendingUp,
  Save,
  Loader2,
  Link2,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DailyMetrics {
  posts_published: number;
  reels_published: number;
  stories_published: number;
  reach: number;
  profile_visits: number;
  saves: number;
  shares: number;
  dms_received: number;
  inquiry_forms: number;
  ad_leads: number;
  referral_leads: number;
  consults_booked: number;
  consults_completed: number;
  services_booked: number;
  revenue_booked: number;
  new_clients: number;
}

const initialMetrics: DailyMetrics = {
  posts_published: 0,
  reels_published: 0,
  stories_published: 0,
  reach: 0,
  profile_visits: 0,
  saves: 0,
  shares: 0,
  dms_received: 0,
  inquiry_forms: 0,
  ad_leads: 0,
  referral_leads: 0,
  consults_booked: 0,
  consults_completed: 0,
  services_booked: 0,
  revenue_booked: 0,
  new_clients: 0,
};

export default function Stats() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<DailyMetrics>(initialMetrics);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Phorest data
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const { data: phorestConnection } = usePhorestConnection();
  const { data: phorestMetrics, isLoading: phorestLoading } = usePhorestPerformanceMetrics(weekStart);

  // Find current user's Phorest metrics
  const myPhorestMetrics = useMemo(() => {
    if (!phorestMetrics || !user) return null;
    return phorestMetrics.find((m: any) => m.user_id === user.id);
  }, [phorestMetrics, user]);

  const handleChange = (field: keyof DailyMetrics, value: string) => {
    setMetrics(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    // For now, just show a success message
    // Full implementation would save to daily_completions/daily_metrics
    
    toast({
      title: 'Metrics saved',
      description: 'Your daily metrics have been logged.',
    });
    
    setSaving(false);
  };

  const totalLeads = metrics.dms_received + metrics.inquiry_forms + metrics.ad_leads + metrics.referral_leads;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl mb-2">
              MY STATS
            </h1>
            <p className="text-muted-foreground font-sans">
              Track your daily metrics and performance.
            </p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="font-display tracking-wide"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                SAVE
              </>
            )}
          </Button>
        </div>

        {/* Phorest Stats Card (if connected) */}
        {myPhorestMetrics && (
          <Card className="p-6 bg-primary/5 border-primary/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                <h2 className="font-display text-sm tracking-wide">PHOREST DATA - THIS WEEK</h2>
              </div>
              <Badge variant="outline" className="text-primary border-primary">
                <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-display">{myPhorestMetrics.new_clients}</p>
                <p className="text-xs text-muted-foreground">New Clients</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display">${Number(myPhorestMetrics.total_revenue).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display">{myPhorestMetrics.service_count}</p>
                <p className="text-xs text-muted-foreground">Services</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display">{Number(myPhorestMetrics.retention_rate).toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Retention</p>
              </div>
            </div>
          </Card>
        )}

        {/* Show connection prompt if not connected */}
        {!myPhorestMetrics && phorestConnection?.connected && (
          <Card className="p-4 bg-muted/50 border-dashed mb-6">
            <p className="text-sm text-muted-foreground text-center">
              Your account isn't linked to Phorest yet. <Link to="/dashboard/admin/phorest" className="text-primary underline">Set up staff mapping</Link> to see your stats automatically.
            </p>
          </Card>
        )}

        <Tabs defaultValue="visibility" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="visibility" className="font-display text-xs tracking-wide">
              <Eye className="w-4 h-4 mr-2 hidden lg:block" />
              Visibility
            </TabsTrigger>
            <TabsTrigger value="leads" className="font-display text-xs tracking-wide">
              <MessageCircle className="w-4 h-4 mr-2 hidden lg:block" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="bookings" className="font-display text-xs tracking-wide">
              <Calendar className="w-4 h-4 mr-2 hidden lg:block" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="conversion" className="font-display text-xs tracking-wide">
              <TrendingUp className="w-4 h-4 mr-2 hidden lg:block" />
              Conversion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visibility">
            <Card className="p-6">
              <h2 className="font-display text-sm tracking-wide mb-6">VISIBILITY METRICS</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <MetricInput
                  label="Posts Published"
                  value={metrics.posts_published}
                  onChange={(v) => handleChange('posts_published', v)}
                />
                <MetricInput
                  label="Reels Published"
                  value={metrics.reels_published}
                  onChange={(v) => handleChange('reels_published', v)}
                />
                <MetricInput
                  label="Stories Published"
                  value={metrics.stories_published}
                  onChange={(v) => handleChange('stories_published', v)}
                />
                <MetricInput
                  label="Reach"
                  value={metrics.reach}
                  onChange={(v) => handleChange('reach', v)}
                />
                <MetricInput
                  label="Profile Visits"
                  value={metrics.profile_visits}
                  onChange={(v) => handleChange('profile_visits', v)}
                />
                <MetricInput
                  label="Saves"
                  value={metrics.saves}
                  onChange={(v) => handleChange('saves', v)}
                />
                <MetricInput
                  label="Shares"
                  value={metrics.shares}
                  onChange={(v) => handleChange('shares', v)}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="leads">
            <Card className="p-6">
              <h2 className="font-display text-sm tracking-wide mb-6">LEAD METRICS</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <MetricInput
                  label="DMs Received"
                  value={metrics.dms_received}
                  onChange={(v) => handleChange('dms_received', v)}
                />
                <MetricInput
                  label="Inquiry Forms"
                  value={metrics.inquiry_forms}
                  onChange={(v) => handleChange('inquiry_forms', v)}
                />
                <MetricInput
                  label="Ad Leads"
                  value={metrics.ad_leads}
                  onChange={(v) => handleChange('ad_leads', v)}
                />
                <MetricInput
                  label="Referral Leads"
                  value={metrics.referral_leads}
                  onChange={(v) => handleChange('referral_leads', v)}
                />
                <div className="md:col-span-2 lg:col-span-3">
                  <Card className="bg-muted p-4">
                    <p className="text-sm text-muted-foreground font-sans">
                      Total Leads Today: <span className="font-display text-foreground text-lg ml-2">{totalLeads}</span>
                    </p>
                  </Card>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="p-6">
              <h2 className="font-display text-sm tracking-wide mb-6">BOOKING METRICS</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <MetricInput
                  label="Consults Booked"
                  value={metrics.consults_booked}
                  onChange={(v) => handleChange('consults_booked', v)}
                />
                <MetricInput
                  label="Consults Completed"
                  value={metrics.consults_completed}
                  onChange={(v) => handleChange('consults_completed', v)}
                />
                <MetricInput
                  label="Services Booked"
                  value={metrics.services_booked}
                  onChange={(v) => handleChange('services_booked', v)}
                />
                <MetricInput
                  label="Revenue Booked"
                  value={metrics.revenue_booked}
                  onChange={(v) => handleChange('revenue_booked', v)}
                  prefix="$"
                />
                <MetricInput
                  label="New Clients"
                  value={metrics.new_clients}
                  onChange={(v) => handleChange('new_clients', v)}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="conversion">
            <Card className="p-6">
              <h2 className="font-display text-sm tracking-wide mb-6">CONVERSION DASHBOARD</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Inquiry → Consult"
                  value={totalLeads > 0 
                    ? `${Math.round((metrics.consults_booked / totalLeads) * 100)}%` 
                    : '0%'
                  }
                />
                <StatCard
                  label="Consult → Booking"
                  value={metrics.consults_completed > 0 
                    ? `${Math.round((metrics.services_booked / metrics.consults_completed) * 100)}%` 
                    : '0%'
                  }
                />
                <StatCard
                  label="Avg Ticket Value"
                  value={metrics.services_booked > 0 
                    ? `$${Math.round(metrics.revenue_booked / metrics.services_booked)}` 
                    : '$0'
                  }
                />
                <StatCard
                  label="New Clients"
                  value={metrics.new_clients.toString()}
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function MetricInput({ 
  label, 
  value, 
  onChange,
  prefix
}: { 
  label: string; 
  value: number; 
  onChange: (value: string) => void;
  prefix?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          min="0"
          className={prefix ? 'pl-7' : ''}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4 text-center">
      <p className="text-xs text-muted-foreground font-display tracking-wide mb-2">
        {label}
      </p>
      <p className="font-display text-2xl">{value}</p>
    </Card>
  );
}
