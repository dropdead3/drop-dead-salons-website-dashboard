import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertCircle, 
  Clock, 
  Key, 
  Zap, 
  Settings,
  ExternalLink,
  BarChart3
} from "lucide-react";

interface BuildTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'blocked' | 'complete';
  category: 'api' | 'enhancement' | 'setup' | 'integration';
  priority: 'high' | 'medium' | 'low';
  blockedBy?: string;
  notes?: string[];
}

const buildTasks: BuildTask[] = [
  // Blocked Tasks
  {
    id: 'vapid-keys',
    title: 'VAPID Keys for Push Notifications',
    description: 'Generate and configure VAPID public/private key pair for Web Push API authentication',
    status: 'blocked',
    category: 'setup',
    priority: 'high',
    blockedBy: 'Need to generate keys and add as secrets',
    notes: [
      'Generate keys using: npx web-push generate-vapid-keys',
      'Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to project secrets',
      'Push notification infrastructure is ready and waiting for keys'
    ]
  },
  {
    id: 'phorest-api',
    title: 'Phorest Booking Calendar Integration',
    description: 'Integrate Phorest API to pull real-time booking calendar data for conflict detection',
    status: 'blocked',
    category: 'api',
    priority: 'high',
    blockedBy: 'Waiting for Phorest API keys',
    notes: [
      'Will enable real-time calendar sync',
      'Conflict detection with actual bookings',
      'Auto-suggest available time slots for assistant requests'
    ]
  },
  {
    id: 'phorest-client-data',
    title: 'Phorest Client Data Sync',
    description: 'Pull client information from Phorest for enhanced request details',
    status: 'blocked',
    category: 'api',
    priority: 'medium',
    blockedBy: 'Waiting for Phorest API keys',
    notes: [
      'Client history and preferences',
      'Service history for better assistant matching'
    ]
  },
  
  // Completed Features
  {
    id: 'response-tracking',
    title: 'Response Time Tracking',
    description: 'Automatic calculation of time between assignment and accept/decline',
    status: 'complete',
    category: 'enhancement',
    priority: 'high',
    notes: ['Database trigger calculates response_time_seconds automatically']
  },
  {
    id: 'manual-override',
    title: 'Admin Manual Override',
    description: 'Ability for admins to manually assign specific assistants',
    status: 'complete',
    category: 'enhancement',
    priority: 'high'
  },
  {
    id: 'performance-metrics',
    title: 'Assistant Performance Metrics',
    description: 'Reliability scores, acceptance rates, and average response times',
    status: 'complete',
    category: 'enhancement',
    priority: 'high'
  },
  {
    id: 'workload-viz',
    title: 'Workload Distribution Visualization',
    description: 'Charts showing assignment distribution across assistants',
    status: 'complete',
    category: 'enhancement',
    priority: 'medium'
  },
  {
    id: 'calendar-view',
    title: 'Calendar View with Conflict Detection',
    description: 'Monthly calendar showing all requests with overlap detection',
    status: 'complete',
    category: 'enhancement',
    priority: 'high',
    notes: ['Ready for Phorest integration to add real booking data']
  },
  {
    id: 'profile-history',
    title: 'Profile History Integration',
    description: 'Request history card on ViewProfile for assistants',
    status: 'complete',
    category: 'enhancement',
    priority: 'medium'
  },
  {
    id: 'email-notifications',
    title: 'Email Notifications for Accept/Decline',
    description: 'Stylists receive email when their request is accepted or declined',
    status: 'complete',
    category: 'enhancement',
    priority: 'high'
  },
  {
    id: 'push-infrastructure',
    title: 'Push Notification Infrastructure',
    description: 'Service worker, subscription management, and edge function ready',
    status: 'complete',
    category: 'enhancement',
    priority: 'high',
    notes: ['Waiting on VAPID keys to activate']
  },
  
  // Pending Enhancements
  {
    id: 'sms-notifications',
    title: 'SMS Notifications via Twilio',
    description: 'Text message alerts for urgent assignments',
    status: 'pending',
    category: 'enhancement',
    priority: 'medium',
    notes: ['Requires Twilio API keys']
  },
  {
    id: 'ai-suggestions',
    title: 'AI-Powered Assistant Suggestions',
    description: 'Smart recommendations based on workload, history, and availability',
    status: 'pending',
    category: 'enhancement',
    priority: 'low'
  },
  {
    id: 'stylist-preferences',
    title: 'Stylist Preference Settings',
    description: 'Allow stylists to set and rank preferred assistants',
    status: 'pending',
    category: 'enhancement',
    priority: 'medium'
  },
  {
    id: 'weekly-reports',
    title: 'Weekly Performance Reports',
    description: 'Automated email summaries of assistant metrics to managers',
    status: 'pending',
    category: 'enhancement',
    priority: 'low'
  }
];

const priorityConfig = {
  'high': { label: 'High', color: 'bg-destructive/20 text-destructive' },
  'medium': { label: 'Medium', color: 'bg-accent text-accent-foreground' },
  'low': { label: 'Low', color: 'bg-muted text-muted-foreground' }
};

const categoryIcons = {
  'api': Key,
  'enhancement': Zap,
  'setup': Settings,
  'integration': ExternalLink
};

export default function DashboardBuild() {
  const blockedTasks = buildTasks.filter(t => t.status === 'blocked');
  const pendingTasks = buildTasks.filter(t => t.status === 'pending');
  const completeTasks = buildTasks.filter(t => t.status === 'complete');

  const completionRate = Math.round((completeTasks.length / buildTasks.length) * 100);

  return (
    <DashboardLayout>
      <div className="space-y-6 px-4 md:px-8 py-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard Build Status</h1>
          <p className="text-muted-foreground">Track pending tasks, API integrations, and enhancement roadmap</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completionRate}%</p>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{blockedTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Blocked</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completeTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blocked Tasks - Priority */}
        {blockedTasks.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Blocked - Action Required</CardTitle>
              </div>
              <CardDescription>These items need external input to proceed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {blockedTasks.map(task => {
                const CategoryIcon = categoryIcons[task.category];
                return (
                  <div key={task.id} className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <CategoryIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                      </div>
                      <Badge className={priorityConfig[task.priority].color}>
                        {priorityConfig[task.priority].label}
                      </Badge>
                    </div>
                    {task.blockedBy && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{task.blockedBy}</span>
                      </div>
                    )}
                    {task.notes && task.notes.length > 0 && (
                      <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                        {task.notes.map((note, i) => (
                          <li key={i} className="list-disc">{note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Pending Enhancements */}
        {pendingTasks.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Pending Enhancements</CardTitle>
              </div>
              <CardDescription>Future features and improvements in the roadmap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTasks.map(task => {
                const CategoryIcon = categoryIcons[task.category];
                return (
                  <div key={task.id} className="p-4 rounded-lg border bg-card space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <CategoryIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                      </div>
                      <Badge className={priorityConfig[task.priority].color}>
                        {priorityConfig[task.priority].label}
                      </Badge>
                    </div>
                    {task.notes && task.notes.length > 0 && (
                      <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                        {task.notes.map((note, i) => (
                          <li key={i} className="list-disc">{note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Completed Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Completed</CardTitle>
            </div>
            <CardDescription>{completeTasks.length} features shipped and ready</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {completeTasks.map(task => {
                const CategoryIcon = categoryIcons[task.category];
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Checkbox checked disabled className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                    <CategoryIcon className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{task.title}</span>
                      {task.notes && task.notes.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">{task.notes[0]}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
