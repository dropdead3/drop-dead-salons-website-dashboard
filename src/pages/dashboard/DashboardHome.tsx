import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Enrollment {
  id: string;
  current_day: number;
  streak_count: number;
  status: string;
  weekly_wins_due_day: number | null;
  start_date: string;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasEnrollment, setHasEnrollment] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEnrollment();
    }
  }, [user]);

  const fetchEnrollment = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('stylist_program_enrollment')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching enrollment:', error);
    } else if (data) {
      setEnrollment(data as Enrollment);
      setHasEnrollment(true);
    }
    setLoading(false);
  };

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
    } else {
      setEnrollment(data as Enrollment);
      setHasEnrollment(true);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasEnrollment) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-foreground text-background mx-auto mb-8 flex items-center justify-center">
              <Target className="w-10 h-10" />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl mb-4">
              DROP DEAD 75
            </h1>
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
          <div className="flex items-center gap-4 mb-2">
            <h1 className="font-display text-3xl lg:text-4xl">
              DAY {enrollment?.current_day}
            </h1>
            <span className="text-sm text-muted-foreground font-sans">of 75</span>
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
                completed={false}
              />
              <TaskItem 
                label="Respond to all DMs within 2 hours"
                completed={false}
              />
              <TaskItem 
                label="Follow up with 3 potential clients"
                completed={false}
              />
              <TaskItem 
                label="Log your daily metrics"
                completed={false}
              />
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-display text-sm tracking-wide mb-4">PROOF OF WORK</h2>
              <p className="text-sm text-muted-foreground font-sans mb-4">
                Upload a screenshot or video of your content posted today.
              </p>
              <Button variant="outline" className="w-full" disabled={isPaused}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Proof
              </Button>
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
            disabled={isPaused}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            SUBMIT DAY {enrollment?.current_day} FOR COMPLETION
          </Button>
          <p className="text-xs text-muted-foreground font-sans mt-2">
            All tasks, proof, and metrics must be complete to submit.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function TaskItem({ label, completed }: { label: string; completed: boolean }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
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
    </label>
  );
}
