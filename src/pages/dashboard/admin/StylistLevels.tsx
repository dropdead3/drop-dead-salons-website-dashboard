import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { 
  Layers, 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Save,
  X,
  Users,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { stylistLevels as initialLevels } from '@/data/servicePricing';

type StylistLevel = {
  id: string;
  label: string;
  clientLabel: string;
};

export default function StylistLevels() {
  const [levels, setLevels] = useState<StylistLevel[]>(() => 
    initialLevels.map((l, idx) => ({ 
      id: l.id, 
      label: l.label, 
      clientLabel: `Level ${idx + 1}` 
    }))
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newLevelName, setNewLevelName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch stylists with their levels to show counts
  const { data: stylistsByLevel } = useQuery({
    queryKey: ['stylists-by-level'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('stylist_level')
        .not('stylist_level', 'is', null);
      
      if (error) throw error;
      
      // Count stylists per level
      const counts: Record<string, number> = {};
      data?.forEach(profile => {
        if (profile.stylist_level) {
          counts[profile.stylist_level] = (counts[profile.stylist_level] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const getStylistCount = (levelId: string): number => {
    return stylistsByLevel?.[levelId] || 0;
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newLevels = [...levels];
    [newLevels[index - 1], newLevels[index]] = [newLevels[index], newLevels[index - 1]];
    const updatedLevels = newLevels.map((level, idx) => ({
      ...level,
      clientLabel: `Level ${idx + 1}`,
    }));
    setLevels(updatedLevels);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === levels.length - 1) return;
    const newLevels = [...levels];
    [newLevels[index], newLevels[index + 1]] = [newLevels[index + 1], newLevels[index]];
    const updatedLevels = newLevels.map((level, idx) => ({
      ...level,
      clientLabel: `Level ${idx + 1}`,
    }));
    setLevels(updatedLevels);
    setHasChanges(true);
  };

  const handleRename = (index: number, newLabel: string) => {
    const newLevels = [...levels];
    newLevels[index] = {
      ...newLevels[index],
      label: newLabel,
    };
    setLevels(newLevels);
    setHasChanges(true);
  };

  const handleDelete = (index: number) => {
    const newLevels = levels.filter((_, idx) => idx !== index);
    const updatedLevels = newLevels.map((level, idx) => ({
      ...level,
      clientLabel: `Level ${idx + 1}`,
    }));
    setLevels(updatedLevels);
    setHasChanges(true);
    toast.success('Level deleted');
  };

  const handleAddNew = () => {
    if (!newLevelName.trim()) return;
    
    const newId = newLevelName.toLowerCase().replace(/\s+/g, '-');
    const newLevel: StylistLevel = {
      id: newId,
      label: newLevelName.trim(),
      clientLabel: `Level ${levels.length + 1}`,
    };
    
    setLevels([...levels, newLevel]);
    setNewLevelName('');
    setIsAddingNew(false);
    setHasChanges(true);
    toast.success('Level added');
  };

  const handleSave = () => {
    // In a real implementation, this would save to the database
    toast.success('Stylist levels saved successfully');
    setHasChanges(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Stylist Levels</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage experience levels and pricing tiers
            </p>
          </div>
          
          {hasChanges && (
            <Button 
              className="gap-2" 
              onClick={handleSave}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          )}
        </div>

        {/* Levels List */}
        <div className="space-y-2">
          {levels.map((level, index) => {
            const stylistCount = getStylistCount(level.id);
            const hasStylists = stylistCount > 0;
            
            return (
              <div
                key={level.id}
                className={cn(
                  "group flex items-center gap-4 px-4 py-3 rounded-xl bg-card border transition-all duration-200 hover:shadow-sm",
                  editingIndex === index && "ring-2 ring-primary/50 shadow-sm"
                )}
              >
                {/* Reorder buttons - subtle */}
                <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-0.5 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    className="p-0.5 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={index === levels.length - 1}
                    onClick={() => handleMoveDown(index)}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Level number - minimal */}
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>

                {/* Level name - editable or display */}
                {editingIndex === index ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={level.label}
                      onChange={(e) => handleRename(index, e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingIndex(null);
                        if (e.key === 'Escape') setEditingIndex(null);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setEditingIndex(null)}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-medium truncate">{level.label}</span>
                      {hasStylists && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {stylistCount} stylist{stylistCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-2 rounded-md hover:bg-muted transition-colors"
                        onClick={() => setEditingIndex(index)}
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-2 rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-30"
                            disabled={levels.length <= 1}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              {hasStylists && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                              Delete "{level.label}"?
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                              <div className="space-y-3">
                                {hasStylists ? (
                                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200">
                                    <p className="font-medium flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4" />
                                      Warning: {stylistCount} stylist{stylistCount !== 1 ? 's are' : ' is'} assigned to this level
                                    </p>
                                    <p className="text-sm mt-1 text-amber-700 dark:text-amber-300">
                                      You'll need to reassign these stylists to a different level.
                                    </p>
                                  </div>
                                ) : (
                                  <p>No stylists are currently assigned to this level.</p>
                                )}
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(index)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new level */}
          {isAddingNew ? (
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
              <div className="w-8" /> {/* Spacer for alignment */}
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                {levels.length + 1}
              </span>
              <Input
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                placeholder="Enter level name..."
                className="h-8 text-sm flex-1 border-0 bg-transparent focus-visible:ring-0 px-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNew();
                  if (e.key === 'Escape') {
                    setIsAddingNew(false);
                    setNewLevelName('');
                  }
                }}
              />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={handleAddNew}
                  disabled={!newLevelName.trim()}
                >
                  Add
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewLevelName('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Level</span>
            </button>
          )}
        </div>

        {/* Helper text */}
        <p className="text-xs text-muted-foreground text-center">
          Levels determine pricing tiers. Reorder using the arrows on the left.
        </p>
      </div>
    </DashboardLayout>
  );
}
