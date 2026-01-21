import { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyCompletion } from '@/hooks/useDailyCompletion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  ChevronRight,
  Play,
  Lock,
  Loader2,
  ImageIcon,
  RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DD75Logo from '@/assets/dd75-logo.svg';
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

export default function Program() {
  const { user } = useAuth();
  const {
    enrollment,
    todayCompletion,
    tasks,
    loading,
    updateTask,
    uploadProof,
    submitDay,
    refetch,
  } = useDailyCompletion(user?.id);
  
  const [hasEnrollment, setHasEnrollment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check enrollment when data loads
  if (!loading && enrollment && !hasEnrollment) {
    setHasEnrollment(true);
  }

  const startProgram = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('stylist_program_enrollment')
      .insert({
        user_id: user.id,
        current_day: 1,
        streak_count: 0,
        status: 'active',
        weekly_wins_due_day: 7,
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting program:', error);
      toast.error('Failed to start program');
    } else {
      setHasEnrollment(true);
      refetch();
    }
  };

  const restartProgram = async () => {
    if (!user || !enrollment) return;
    
    setRestarting(true);
    
    const { error } = await supabase
      .from('stylist_program_enrollment')
      .update({
        current_day: 1,
        streak_count: 0,
        status: 'active',
        restart_count: (enrollment.restart_count || 0) + 1,
        start_date: new Date().toISOString().split('T')[0],
        last_completion_date: null,
        weekly_wins_due_day: 7,
      })
      .eq('id', enrollment.id);

    if (error) {
      console.error('Error restarting program:', error);
      toast.error('Failed to restart program');
    } else {
      toast.success('Program restarted! You\'re back on Day 1');
      refetch();
    }
    
    setRestarting(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadProof(file);
    if (url) {
      toast.success('Proof uploaded successfully');
      refetch();
    }
    setUploading(false);
  };

  const handleSubmitDay = async () => {
    setSubmitting(true);
    await submitDay();
    setSubmitting(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasEnrollment && !enrollment) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <div className="text-center py-20">
            <img 
              src={DD75Logo} 
              alt="Drop Dead 75: Client Engine Program" 
              className="h-10 lg:h-12 w-auto mx-auto mb-8"
            />
            <p className="text-muted-foreground font-sans mb-8 max-w-md mx-auto">
              75 days of execution. No excuses. Build your client engine and 
              transform your book.
            </p>
            <div className="bg-card border border-border p-6 mb-8 text-left max-w-md mx-auto">
              <h3 className="font-display text-sm tracking-wide mb-4">THE RULES</h3>
              <ul className="space-y-3 text-sm font-sans text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-foreground">1.</span>
                  Complete all daily tasks
                </li>
                <li className="flex gap-2">
                  <span className="text-foreground">2.</span>
                  Upload proof of work
                </li>
                <li className="flex gap-2">
                  <span className="text-foreground">3.</span>
                  Log your metrics
                </li>
                <li className="flex gap-2">
                  <span className="text-foreground">4.</span>
                  Submit Weekly Wins every 7 days
                </li>
                <li className="flex gap-2">
                  <span className="text-foreground font-medium">5.</span>
                  <span className="text-foreground font-medium">Miss one day = restart</span>
                </li>
              </ul>
            </div>
            <Button 
              onClick={startProgram}
              className="font-display tracking-wide px-8 py-6 text-base"
            >
              <Play className="w-4 h-4 mr-2" />
              START DAY 1
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const progressPercent = ((enrollment?.current_day || 1) / 75) * 100;
  const isWeeklyWinsDue = enrollment?.weekly_wins_due_day === enrollment?.current_day;
  const isPaused = enrollment?.status === 'paused';

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-3xl lg:text-4xl">
                DAY {enrollment?.current_day}
              </h1>
              <span className="text-sm text-muted-foreground font-sans">of 75</span>
            </div>
            
            {/* Restart Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={restarting}
                  className="text-muted-foreground hover:text-destructive hover:border-destructive"
                >
                  {restarting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Restart
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restart the 75-Day Program?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset your progress back to Day 1. Your streak will be reset to 0 
                    and you'll start fresh. This action cannot be undone.
                    {enrollment && enrollment.restart_count > 0 && (
                      <span className="block mt-2 text-muted-foreground">
                        You've restarted {enrollment.restart_count} time{enrollment.restart_count > 1 ? 's' : ''} before.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={restartProgram}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Restart Program
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-sans">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{enrollment?.streak_count} day streak</span>
            </div>
            {enrollment?.status === 'active' && (
              <span className="px-2 py-1 bg-green-500/10 text-green-600 text-xs font-display tracking-wide">
                ACTIVE
              </span>
            )}
            {isPaused && (
              <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 text-xs font-display tracking-wide">
                PAUSED
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-sans text-muted-foreground">Program Progress</span>
            <span className="text-sm font-display">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </Card>

        {/* Paused Warning */}
        {isPaused && (
          <Card className="p-6 mb-8 border-yellow-500/50 bg-yellow-500/5">
            <div className="flex items-start gap-4">
              <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-sm tracking-wide mb-1">
                  PROGRESS PAUSED
                </h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Submit your Weekly Wins Report to unlock Day {enrollment?.current_day}.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  asChild
                >
                  <Link to="/dashboard/weekly-wins">
                    Submit Weekly Wins
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Weekly Wins Due */}
        {isWeeklyWinsDue && !isPaused && (
          <Card className="p-6 mb-8 border-blue-500/50 bg-blue-500/5">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-sm tracking-wide mb-1">
                  WEEKLY WINS DUE TODAY
                </h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Submit your Weekly Wins Report before completing today's tasks.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  asChild
                >
                  <Link to="/dashboard/weekly-wins">
                    Submit Report
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Today's Tasks */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-display text-sm tracking-wide mb-6">TODAY'S TASKS</h2>
            <div className="space-y-4">
              <TaskItem 
                label="Post content (reel, story, or carousel)"
                completed={tasks.content_posted}
                onChange={(v) => updateTask('content_posted', v)}
                disabled={isPaused}
              />
              <TaskItem 
                label="Respond to all DMs within 2 hours"
                completed={tasks.dms_responded}
                onChange={(v) => updateTask('dms_responded', v)}
                disabled={isPaused}
              />
              <TaskItem 
                label="Follow up with 3 potential clients"
                completed={tasks.follow_ups}
                onChange={(v) => updateTask('follow_ups', v)}
                disabled={isPaused}
              />
              <TaskItem 
                label="Log your daily metrics"
                completed={tasks.metrics_logged}
                onChange={(v) => updateTask('metrics_logged', v)}
                disabled={isPaused}
              />
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-display text-sm tracking-wide mb-4">PROOF OF WORK</h2>
              <p className="text-sm text-muted-foreground font-sans mb-4">
                Upload a screenshot or video of your content posted today.
              </p>
              {todayCompletion?.proof_url ? (
                <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30">
                  <ImageIcon className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-sans text-green-600">Proof uploaded</span>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled={isPaused || uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Proof
                      </>
                    )}
                  </Button>
                </>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-sm tracking-wide mb-4">QUICK ACTIONS</h2>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  asChild
                >
                  <Link to="/dashboard/stats">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Log Today's Metrics
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/dashboard/ring-the-bell">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Ring the Bell
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Submit Day Button */}
        <div className="mt-8">
          <Button 
            className="w-full lg:w-auto font-display tracking-wide px-8 py-6"
            disabled={isPaused || submitting}
            onClick={handleSubmitDay}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                SUBMITTING...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                SUBMIT DAY {enrollment?.current_day} FOR COMPLETION
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground font-sans mt-2">
            All tasks, proof, and metrics must be complete to submit.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface TaskItemProps {
  label: string;
  completed: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function TaskItem({ label, completed, onChange, disabled }: TaskItemProps) {
  return (
    <button 
      className="flex items-center gap-3 cursor-pointer group w-full text-left disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => !disabled && onChange(!completed)}
      disabled={disabled}
    >
      <div className={`
        w-5 h-5 border flex items-center justify-center transition-colors
        ${completed 
          ? 'bg-foreground border-foreground' 
          : 'border-border group-hover:border-foreground'
        }
      `}>
        {completed && <CheckCircle2 className="w-3 h-3 text-background" />}
      </div>
      <span className={`text-sm font-sans ${completed ? 'line-through text-muted-foreground' : ''}`}>
        {label}
      </span>
    </button>
  );
}
