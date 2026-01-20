import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Download, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight,
  PartyPopper,
  Sparkles,
  CreditCard,
  ClipboardCheck,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Handbook {
  id: string;
  title: string;
  category: string | null;
  content: string | null;
  file_url: string | null;
  version: string | null;
  updated_at: string;
}

interface Acknowledgment {
  handbook_id: string;
  acknowledged_at: string;
}

interface BusinessCardRequest {
  id: string;
  design_style: string;
  status: string;
  requested_at: string;
}

interface TaskCompletion {
  task_key: string;
  completed_at: string;
}

interface OnboardingTask {
  id: string;
  title: string;
  description: string | null;
  visible_to_roles: AppRole[];
  display_order: number;
}

const BUSINESS_CARD_STYLES = [
  { 
    id: 'classic', 
    name: 'Classic', 
    description: 'Clean and professional with traditional layout',
    preview: 'bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900'
  },
  { 
    id: 'modern', 
    name: 'Modern', 
    description: 'Bold and contemporary with striking design',
    preview: 'bg-gradient-to-br from-primary/20 to-primary/40'
  },
];

export default function Onboarding() {
  const { roles, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Handbook state
  const [handbooks, setHandbooks] = useState<Handbook[]>([]);
  const [acknowledgments, setAcknowledgments] = useState<Acknowledgment[]>([]);
  const [selectedHandbook, setSelectedHandbook] = useState<Handbook | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasReadContent, setHasReadContent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Business card state
  const [businessCardRequest, setBusinessCardRequest] = useState<BusinessCardRequest | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [requestingCard, setRequestingCard] = useState(false);
  
  // Task state
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  
  // Loading state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roles.length > 0 && user) {
      fetchData();
    } else if (roles.length === 0) {
      setLoading(false);
    }
  }, [roles, user]);

  const fetchData = async () => {
    const [handbooksResult, acknowledgementsResult, businessCardResult, tasksResult, completionsResult] = await Promise.all([
      supabase
        .from('handbooks')
        .select('id, title, category, content, file_url, version, updated_at, visible_to_roles')
        .eq('is_active', true)
        .eq('category', 'Onboarding')
        .order('title'),
      supabase
        .from('handbook_acknowledgments')
        .select('handbook_id, acknowledged_at'),
      supabase
        .from('business_card_requests')
        .select('id, design_style, status, requested_at')
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('onboarding_tasks')
        .select('id, title, description, visible_to_roles, display_order')
        .eq('is_active', true)
        .order('display_order'),
      supabase
        .from('onboarding_task_completions')
        .select('task_key, completed_at')
    ]);

    if (handbooksResult.error) {
      console.error('Error fetching handbooks:', handbooksResult.error);
    } else {
      const filteredHandbooks = (handbooksResult.data || []).filter((handbook: any) => {
        const visibleRoles = handbook.visible_to_roles || [];
        return roles.some(role => visibleRoles.includes(role));
      });
      setHandbooks(filteredHandbooks);
      
      if (acknowledgementsResult.data) {
        const ackIds = acknowledgementsResult.data.map(a => a.handbook_id);
        const firstUnack = filteredHandbooks.findIndex(h => !ackIds.includes(h.id));
        if (firstUnack !== -1) {
          setCurrentIndex(firstUnack);
        }
      }
    }

    if (!acknowledgementsResult.error) {
      setAcknowledgments(acknowledgementsResult.data || []);
    }

    if (!businessCardResult.error && businessCardResult.data) {
      setBusinessCardRequest(businessCardResult.data);
    }

    // Filter tasks by user roles
    if (!tasksResult.error) {
      const filteredTasks = (tasksResult.data || []).filter((task: OnboardingTask) => {
        const visibleRoles = task.visible_to_roles || [];
        return roles.some(role => visibleRoles.includes(role));
      });
      setOnboardingTasks(filteredTasks);
    }

    if (!completionsResult.error) {
      setTaskCompletions(completionsResult.data || []);
    }

    setLoading(false);
  };

  const isAcknowledged = (handbookId: string) => {
    return acknowledgments.some(ack => ack.handbook_id === handbookId);
  };

  const isTaskCompleted = (taskId: string) => {
    return taskCompletions.some(tc => tc.task_key === taskId);
  };

  const handleAcknowledge = async () => {
    if (!selectedHandbook || !user) return;
    
    setSubmitting(true);
    
    const { error } = await supabase
      .from('handbook_acknowledgments')
      .insert({
        user_id: user.id,
        handbook_id: selectedHandbook.id
      });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } else {
      setAcknowledgments(prev => [...prev, {
        handbook_id: selectedHandbook.id,
        acknowledged_at: new Date().toISOString()
      }]);
      toast({
        title: 'Acknowledged!',
        description: 'Document has been acknowledged.'
      });
      setSelectedHandbook(null);
      setHasReadContent(false);
      
      const nextUnack = handbooks.findIndex((h, i) => 
        i > currentIndex && !isAcknowledged(h.id) && h.id !== selectedHandbook.id
      );
      if (nextUnack !== -1) {
        setCurrentIndex(nextUnack);
      }
    }
    
    setSubmitting(false);
  };

  const handleRequestBusinessCard = async () => {
    if (!selectedStyle || !user) return;
    
    setRequestingCard(true);
    
    const { data, error } = await supabase
      .from('business_card_requests')
      .insert({
        user_id: user.id,
        design_style: selectedStyle
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } else {
      setBusinessCardRequest(data);
      toast({
        title: 'Request Submitted!',
        description: 'Your business card request has been submitted.'
      });
    }
    
    setRequestingCard(false);
  };

  const handleToggleTask = async (taskId: string) => {
    if (!user) return;
    
    const isCompleted = isTaskCompleted(taskId);
    
    if (isCompleted) {
      const { error } = await supabase
        .from('onboarding_task_completions')
        .delete()
        .eq('user_id', user.id)
        .eq('task_key', taskId);

      if (!error) {
        setTaskCompletions(prev => prev.filter(tc => tc.task_key !== taskId));
      }
    } else {
      const { error } = await supabase
        .from('onboarding_task_completions')
        .insert({
          user_id: user.id,
          task_key: taskId
        });

      if (!error) {
        setTaskCompletions(prev => [...prev, {
          task_key: taskId,
          completed_at: new Date().toISOString()
        }]);
      }
    }
  };

  const openHandbook = (handbook: Handbook, index: number) => {
    setSelectedHandbook(handbook);
    setCurrentIndex(index);
    setHasReadContent(false);
  };

  const acknowledgedCount = handbooks.filter(h => isAcknowledged(h.id)).length;
  const totalHandbooks = handbooks.length;
  const handbooksProgress = totalHandbooks > 0 ? (acknowledgedCount / totalHandbooks) * 100 : 100;
  
  const completedTasksCount = onboardingTasks.filter(t => isTaskCompleted(t.id)).length;
  const totalTasks = onboardingTasks.length;
  const tasksProgress = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 100;
  
  const overallProgress = ((handbooksProgress + tasksProgress + (businessCardRequest ? 100 : 0)) / 3);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl lg:text-4xl mb-2">WELCOME ABOARD</h1>
          <p className="text-muted-foreground font-sans max-w-md mx-auto">
            Complete the following sections to finish your onboarding process.
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-sm tracking-wider">OVERALL PROGRESS</span>
            <span className="font-sans text-sm text-muted-foreground">
              {Math.round(overallProgress)}% complete
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </Card>

        {/* Section 1: Handbooks */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg">READ & ACKNOWLEDGE HANDBOOKS</h2>
                <p className="text-sm text-muted-foreground font-sans">
                  Review and acknowledge receipt of required documents
                </p>
              </div>
              <div className="text-right">
                <span className="font-display text-lg">{acknowledgedCount}/{totalHandbooks}</span>
                <p className="text-xs text-muted-foreground">completed</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-3">
            {handbooks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-sans text-sm">No handbooks assigned to your role</p>
              </div>
            ) : (
              handbooks.map((handbook, index) => {
                const acknowledged = isAcknowledged(handbook.id);
                const isCurrent = index === currentIndex && !acknowledged;
                
                return (
                  <div 
                    key={handbook.id} 
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border transition-all",
                      acknowledged 
                        ? 'border-primary/30 bg-primary/5' 
                        : isCurrent 
                          ? 'border-primary ring-1 ring-primary/20' 
                          : 'border-border opacity-60'
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-display text-xs",
                      acknowledged 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {acknowledged ? <Check className="w-4 h-4" /> : index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-sans font-medium text-sm">{handbook.title}</h3>
                      <p className="text-xs text-muted-foreground">v{handbook.version}</p>
                    </div>

                    {acknowledged ? (
                      <span className="text-xs text-primary font-sans font-medium">Completed</span>
                    ) : (
                      <Button 
                        onClick={() => openHandbook(handbook, index)}
                        size="sm"
                        variant={isCurrent ? 'default' : 'outline'}
                        className="font-display text-xs"
                      >
                        REVIEW
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Section 2: Business Cards */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg">REQUEST YOUR BUSINESS CARDS</h2>
                <p className="text-sm text-muted-foreground font-sans">
                  Choose your preferred design style
                </p>
              </div>
              {businessCardRequest && (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                    Requested
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {businessCardRequest ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-primary" />
                <h3 className="font-display text-lg mb-1">REQUEST SUBMITTED</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  You selected the <span className="font-medium text-foreground capitalize">{businessCardRequest.design_style}</span> design.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Status: <span className="capitalize">{businessCardRequest.status}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {BUSINESS_CARD_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={cn(
                        "relative p-4 rounded-lg border-2 text-left transition-all",
                        selectedStyle === style.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className={cn("h-24 rounded-md mb-3", style.preview)} />
                      <h3 className="font-display text-sm mb-1">{style.name}</h3>
                      <p className="text-xs text-muted-foreground font-sans">{style.description}</p>
                      {selectedStyle === style.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                <Button 
                  onClick={handleRequestBusinessCard}
                  disabled={!selectedStyle || requestingCard}
                  className="w-full font-display"
                >
                  {requestingCard ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'REQUEST BUSINESS CARDS'
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Section 3: Onboarding Tasks Checklist */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg">ONBOARDING CHECKLIST</h2>
                <p className="text-sm text-muted-foreground font-sans">
                  Complete these tasks to finish your setup
                </p>
              </div>
              <div className="text-right">
                <span className="font-display text-lg">{completedTasksCount}/{totalTasks}</span>
                <p className="text-xs text-muted-foreground">completed</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-2">
            {onboardingTasks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-sans text-sm">No tasks assigned to your role</p>
              </div>
            ) : (
              onboardingTasks.map((task) => {
                const completed = isTaskCompleted(task.id);
                
                return (
                  <button
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
                      completed
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all mt-0.5",
                      completed
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/30'
                    )}>
                      {completed && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "font-sans text-sm block",
                        completed && 'text-muted-foreground line-through'
                      )}>
                        {task.title}
                      </span>
                      {task.description && (
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          {task.description}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Completion CTA */}
        {overallProgress >= 100 && (
          <Card className="p-8 text-center bg-primary/5 border-primary/30">
            <PartyPopper className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="font-display text-2xl mb-2">ONBOARDING COMPLETE!</h2>
            <p className="text-muted-foreground font-sans mb-6">
              You've completed all onboarding steps. You're ready to start!
            </p>
            <Button onClick={() => navigate('/dashboard')} size="lg" className="font-display">
              <Sparkles className="w-4 h-4 mr-2" />
              GO TO DASHBOARD
            </Button>
          </Card>
        )}

        {/* Handbook Detail Dialog */}
        <Dialog open={!!selectedHandbook} onOpenChange={(open) => !open && setSelectedHandbook(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            {selectedHandbook && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="px-2 py-0.5 bg-muted rounded">
                      Step {currentIndex + 1} of {totalHandbooks}
                    </span>
                  </div>
                  <DialogTitle className="font-display text-xl">
                    {selectedHandbook.title}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Version {selectedHandbook.version}
                  </p>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto mt-4 space-y-4">
                  {selectedHandbook.content && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {selectedHandbook.content}
                      </div>
                    </div>
                  )}

                  {selectedHandbook.file_url && (
                    <Button asChild variant="outline" className="w-full font-display">
                      <a href={selectedHandbook.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        DOWNLOAD & REVIEW FILE
                      </a>
                    </Button>
                  )}

                  {!selectedHandbook.content && !selectedHandbook.file_url && (
                    <p className="text-muted-foreground text-center py-8">
                      No content available for this document.
                    </p>
                  )}
                </div>

                <DialogFooter className="mt-6 border-t pt-4">
                  <div className="w-full space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <Checkbox
                        id="read-confirm"
                        checked={hasReadContent}
                        onCheckedChange={(checked) => setHasReadContent(checked === true)}
                        className="mt-0.5"
                      />
                      <label 
                        htmlFor="read-confirm" 
                        className="text-sm font-sans leading-tight cursor-pointer"
                      >
                        I confirm that I have read, understood, and agree to comply with the contents of this document.
                      </label>
                    </div>
                    <Button 
                      onClick={handleAcknowledge} 
                      disabled={!hasReadContent || submitting}
                      className="w-full font-display"
                      size="lg"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          ACKNOWLEDGE & CONTINUE
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}