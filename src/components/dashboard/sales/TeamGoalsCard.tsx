import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { Users, Target, Edit2, Trophy, Gift, Loader2, PartyPopper } from 'lucide-react';
import { useTeamGoals } from '@/hooks/useTeamGoals';
import { cn } from '@/lib/utils';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';

interface TeamGoalsCardProps {
  currentRevenue: number;
  period?: 'weekly' | 'monthly' | 'quarterly';
  className?: string;
}

export function TeamGoalsCard({ 
  currentRevenue, 
  period = 'monthly',
  className 
}: TeamGoalsCardProps) {
  const { goals, isLoading, updateGoals, isUpdating } = useTeamGoals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [weeklyTarget, setWeeklyTarget] = useState(0);
  const [quarterlyTarget, setQuarterlyTarget] = useState(0);
  const [description, setDescription] = useState('');
  const [milestones, setMilestones] = useState<{ amount: number; reward: string }[]>([]);

  const handleOpenEdit = () => {
    if (goals) {
      setMonthlyTarget(goals.monthlyTarget);
      setWeeklyTarget(goals.weeklyTarget);
      setQuarterlyTarget(goals.quarterlyTarget);
      setDescription(goals.description);
      setMilestones([...goals.milestones]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    updateGoals({
      monthlyTarget,
      weeklyTarget,
      quarterlyTarget,
      description,
      milestones,
    });
    setIsDialogOpen(false);
  };

  const updateMilestone = (index: number, field: 'amount' | 'reward', value: string | number) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const addMilestone = () => {
    setMilestones([...milestones, { amount: 0, reward: '' }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  if (isLoading || !goals) {
    return (
      <Card className={className}>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const target = period === 'weekly' 
    ? goals.weeklyTarget 
    : period === 'quarterly' 
      ? goals.quarterlyTarget 
      : goals.monthlyTarget;
  
  const progress = target > 0 ? (currentRevenue / target) * 100 : 0;
  const remaining = Math.max(target - currentRevenue, 0);
  const isComplete = progress >= 100;

  // Find reached and upcoming milestones
  const sortedMilestones = [...goals.milestones].sort((a, b) => a.amount - b.amount);
  const reachedMilestones = sortedMilestones.filter(m => currentRevenue >= m.amount);
  const nextMilestone = sortedMilestones.find(m => currentRevenue < m.amount);

  return (
    <>
      <Card className={cn(
        isComplete ? 'bg-chart-2/5 border-chart-2/30' : '',
        className
      )}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="font-display text-lg">Team Goal</CardTitle>
              <CardDescription className="capitalize">{period} Target</CardDescription>
            </div>
            <CommandCenterVisibilityToggle 
              elementKey="team_goals" 
              elementName="Team Goals" 
            />
          </div>
          <Button variant="ghost" size="sm" onClick={handleOpenEdit}>
            <Edit2 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Team Progress</span>
              <span className="font-display">
                ${currentRevenue.toLocaleString()} / ${target.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={Math.min(progress, 100)} 
              className={cn('h-3', isComplete && '[&>div]:bg-chart-2')} 
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.toFixed(1)}% complete</span>
              {isComplete ? (
                <span className="text-chart-2 font-medium flex items-center gap-1">
                  <PartyPopper className="w-3 h-3" /> Goal reached!
                </span>
              ) : (
                <span>${remaining.toLocaleString()} to go</span>
              )}
            </div>
          </div>

          {/* Milestones */}
          {sortedMilestones.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Milestones</p>
              <div className="space-y-2">
                {sortedMilestones.map((milestone, idx) => {
                  const reached = currentRevenue >= milestone.amount;
                  const isNext = nextMilestone?.amount === milestone.amount;
                  const milestoneProgress = Math.min((currentRevenue / milestone.amount) * 100, 100);
                  
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg text-sm',
                        reached ? 'bg-chart-2/10' : isNext ? 'bg-primary/5' : 'bg-muted/50'
                      )}
                    >
                      {reached ? (
                        <Trophy className="w-4 h-4 text-chart-2 shrink-0" />
                      ) : (
                        <Gift className={cn('w-4 h-4 shrink-0', isNext ? 'text-primary' : 'text-muted-foreground')} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={cn('truncate', reached && 'line-through text-muted-foreground')}>
                            {milestone.reward}
                          </span>
                          <Badge variant={reached ? 'default' : 'outline'} className="text-xs ml-2 shrink-0">
                            ${milestone.amount.toLocaleString()}
                          </Badge>
                        </div>
                        {isNext && (
                          <Progress value={milestoneProgress} className="h-1 mt-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Team Goals</DialogTitle>
            <DialogDescription>
              Set collaborative targets and reward milestones
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Weekly</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={weeklyTarget}
                    onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Monthly</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Quarterly</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={quarterlyTarget}
                    onChange={(e) => setQuarterlyTarget(Number(e.target.value))}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Reward Milestones</Label>
                <Button variant="outline" size="sm" onClick={addMilestone}>Add</Button>
              </div>
              <div className="space-y-2">
                {milestones.map((m, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="relative w-28">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        value={m.amount}
                        onChange={(e) => updateMilestone(idx, 'amount', Number(e.target.value))}
                        className="pl-6 h-9"
                        placeholder="Amount"
                      />
                    </div>
                    <Input
                      value={m.reward}
                      onChange={(e) => updateMilestone(idx, 'reward', e.target.value)}
                      className="flex-1 h-9"
                      placeholder="Reward description"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeMilestone(idx)}
                      className="h-9 px-2 text-destructive"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Goals'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
