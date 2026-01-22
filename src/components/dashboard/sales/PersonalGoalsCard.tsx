import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Target, Edit2, Save, X, Loader2 } from 'lucide-react';
import { useStylistPersonalGoals } from '@/hooks/useStylistPersonalGoals';
import { cn } from '@/lib/utils';

interface PersonalGoalsCardProps {
  userId: string;
  currentMonthlyRevenue?: number;
  currentWeeklyRevenue?: number;
}

export function PersonalGoalsCard({ userId, currentMonthlyRevenue = 0, currentWeeklyRevenue = 0 }: PersonalGoalsCardProps) {
  const { goals, isLoading, upsertGoals, isUpdating } = useStylistPersonalGoals(userId);
  const [isEditing, setIsEditing] = useState(false);
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [weeklyTarget, setWeeklyTarget] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (goals) {
      setMonthlyTarget(goals.monthly_target);
      setWeeklyTarget(goals.weekly_target);
      setNotes(goals.notes || '');
    }
  }, [goals]);

  const handleSave = () => {
    upsertGoals({ monthlyTarget, weeklyTarget, notes });
    setIsEditing(false);
  };

  const monthlyProgress = monthlyTarget > 0 ? (currentMonthlyRevenue / monthlyTarget) * 100 : 0;
  const weeklyProgress = weeklyTarget > 0 ? (currentWeeklyRevenue / weeklyTarget) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="font-display text-lg">My Personal Goals</CardTitle>
          </div>
          {!isEditing ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>
        <CardDescription>Set and track your personal sales targets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly">Monthly Target</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="monthly"
                    type="number"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekly">Weekly Target</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="weekly"
                    type="number"
                    value={weeklyTarget}
                    onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Motivation</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What are you working towards?"
                className="resize-none"
                rows={2}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Monthly Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly</span>
                <span className="font-medium">
                  ${currentMonthlyRevenue.toLocaleString()} / ${monthlyTarget.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={Math.min(monthlyProgress, 100)} 
                className={cn(
                  "h-2",
                  monthlyProgress >= 100 && "bg-green-100 [&>div]:bg-green-500"
                )}
              />
              {monthlyProgress >= 100 && (
                <p className="text-xs text-green-600 font-medium">🎉 Goal achieved!</p>
              )}
            </div>

            {/* Weekly Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Weekly</span>
                <span className="font-medium">
                  ${currentWeeklyRevenue.toLocaleString()} / ${weeklyTarget.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={Math.min(weeklyProgress, 100)} 
                className={cn(
                  "h-2",
                  weeklyProgress >= 100 && "bg-green-100 [&>div]:bg-green-500"
                )}
              />
              {weeklyProgress >= 100 && (
                <p className="text-xs text-green-600 font-medium">🎉 Goal achieved!</p>
              )}
            </div>

            {notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground italic">"{notes}"</p>
              </div>
            )}

            {monthlyTarget === 0 && weeklyTarget === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Click edit to set your personal goals
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
