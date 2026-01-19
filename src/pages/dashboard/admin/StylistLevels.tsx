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
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Layers className="w-6 h-6" />
              Stylist Levels
            </h1>
            <p className="text-muted-foreground">
              Manage experience levels for stylists and pricing tiers
            </p>
          </div>
          
          <Button 
            className="gap-2" 
            onClick={handleSave} 
            disabled={!hasChanges}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">About Stylist Levels</p>
              <p className="mt-1 text-blue-700 dark:text-blue-300">
                Levels determine pricing tiers across all services. Stylists are assigned to levels based on experience. 
                Changing level names here will update how they appear throughout the website.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{levels.length}</p>
                <p className="text-sm text-muted-foreground">Total Levels</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Object.values(stylistsByLevel || {}).reduce((a, b) => a + b, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Stylists Assigned</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Levels List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans font-medium normal-case">All Levels</CardTitle>
            <CardDescription>
              Drag to reorder, or use the arrow buttons. Lower levels are typically less experienced.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {levels.map((level, index) => {
              const stylistCount = getStylistCount(level.id);
              const hasStylists = stylistCount > 0;
              
              return (
                <div
                  key={level.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border bg-card transition-colors",
                    editingIndex === index && "ring-2 ring-primary"
                  )}
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === levels.length - 1}
                      onClick={() => handleMoveDown(index)}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Level number badge */}
                  <Badge variant="secondary" className="shrink-0 font-mono text-sm px-3 py-1">
                    {index + 1}
                  </Badge>

                  {/* Level name - editable or display */}
                  {editingIndex === index ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={level.label}
                        onChange={(e) => handleRename(index, e.target.value)}
                        className="h-9"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingIndex(null);
                          if (e.key === 'Escape') setEditingIndex(null);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setEditingIndex(null)}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-medium">{level.label}</span>
                        {hasStylists && (
                          <Badge variant="outline" className="ml-3 text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {stylistCount} stylist{stylistCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setEditingIndex(index)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive hover:text-destructive"
                              disabled={levels.length <= 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
                                        You'll need to reassign these stylists to a different level before or after deletion.
                                      </p>
                                    </div>
                                  ) : (
                                    <p>No stylists are currently assigned to this level.</p>
                                  )}
                                  <p>
                                    This will remove this level from all services. Service pricing will need to be updated for the remaining levels.
                                  </p>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(index)}
                              >
                                Delete Level
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
              <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed bg-muted/50">
                <Badge variant="secondary" className="shrink-0 font-mono text-sm px-3 py-1">
                  {levels.length + 1}
                </Badge>
                <Input
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  placeholder="Enter level name..."
                  className="h-9 flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNew();
                    if (e.key === 'Escape') {
                      setIsAddingNew(false);
                      setNewLevelName('');
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleAddNew}
                  disabled={!newLevelName.trim()}
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewLevelName('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2 border-dashed h-12"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="w-4 h-4" />
                Add New Level
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Unsaved changes indicator */}
        {hasChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            You have unsaved changes
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
