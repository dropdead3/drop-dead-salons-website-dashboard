import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { 
  GripVertical, 
  Plus, 
  Pencil, 
  Trash2, 
  Layers,
  ChevronUp,
  ChevronDown,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type StylistLevel = {
  id: string;
  label: string;
  clientLabel: string;
};

interface StylistLevelsEditorProps {
  levels: StylistLevel[];
  onLevelsChange: (levels: StylistLevel[]) => void;
  trigger?: React.ReactNode;
}

export function StylistLevelsEditor({ 
  levels, 
  onLevelsChange,
  trigger 
}: StylistLevelsEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingLevels, setEditingLevels] = useState<StylistLevel[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newLevelName, setNewLevelName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleOpen = (open: boolean) => {
    if (open) {
      setEditingLevels([...levels]);
    }
    setIsOpen(open);
    setEditingIndex(null);
    setIsAddingNew(false);
    setNewLevelName('');
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newLevels = [...editingLevels];
    [newLevels[index - 1], newLevels[index]] = [newLevels[index], newLevels[index - 1]];
    // Update client labels to reflect new order
    const updatedLevels = newLevels.map((level, idx) => ({
      ...level,
      clientLabel: `Level ${idx + 1}`,
    }));
    setEditingLevels(updatedLevels);
  };

  const handleMoveDown = (index: number) => {
    if (index === editingLevels.length - 1) return;
    const newLevels = [...editingLevels];
    [newLevels[index], newLevels[index + 1]] = [newLevels[index + 1], newLevels[index]];
    // Update client labels to reflect new order
    const updatedLevels = newLevels.map((level, idx) => ({
      ...level,
      clientLabel: `Level ${idx + 1}`,
    }));
    setEditingLevels(updatedLevels);
  };

  const handleRename = (index: number, newLabel: string) => {
    const newLevels = [...editingLevels];
    newLevels[index] = {
      ...newLevels[index],
      label: newLabel,
    };
    setEditingLevels(newLevels);
  };

  const handleDelete = (index: number) => {
    const newLevels = editingLevels.filter((_, idx) => idx !== index);
    // Update client labels to reflect new order
    const updatedLevels = newLevels.map((level, idx) => ({
      ...level,
      clientLabel: `Level ${idx + 1}`,
    }));
    setEditingLevels(updatedLevels);
  };

  const handleAddNew = () => {
    if (!newLevelName.trim()) return;
    
    const newId = newLevelName.toLowerCase().replace(/\s+/g, '-');
    const newLevel: StylistLevel = {
      id: newId,
      label: newLevelName.trim(),
      clientLabel: `Level ${editingLevels.length + 1}`,
    };
    
    setEditingLevels([...editingLevels, newLevel]);
    setNewLevelName('');
    setIsAddingNew(false);
  };

  const handleSave = () => {
    onLevelsChange(editingLevels);
    setIsOpen(false);
  };

  const hasChanges = JSON.stringify(levels) !== JSON.stringify(editingLevels);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Layers className="w-4 h-4" />
            Manage Levels
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Stylist Levels Editor
          </DialogTitle>
          <DialogDescription>
            Add, remove, rename, or reorder stylist levels. Changes will affect pricing across all services.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
          {editingLevels.map((level, index) => (
            <div
              key={level.id}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border bg-card transition-colors",
                editingIndex === index && "ring-2 ring-primary"
              )}
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  disabled={index === 0}
                  onClick={() => handleMoveUp(index)}
                >
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  disabled={index === editingLevels.length - 1}
                  onClick={() => handleMoveDown(index)}
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>

              {/* Level number badge */}
              <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                {index + 1}
              </Badge>

              {/* Level name - editable or display */}
              {editingIndex === index ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={level.label}
                    onChange={(e) => handleRename(index, e.target.value)}
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingIndex(null);
                      if (e.key === 'Escape') setEditingIndex(null);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setEditingIndex(null)}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className="font-medium">{level.label}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingIndex(index)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={editingLevels.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{level.label}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove this level from all services. Services will need their pricing updated for the remaining levels.
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
          ))}

          {/* Add new level */}
          {isAddingNew ? (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed bg-muted/50">
              <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                {editingLevels.length + 1}
              </Badge>
              <Input
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                placeholder="Enter level name..."
                className="h-8 flex-1"
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
                className="h-8 w-8 shrink-0"
                onClick={handleAddNew}
                disabled={!newLevelName.trim()}
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
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
              className="w-full gap-2 border-dashed"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="w-4 h-4" />
              Add New Level
            </Button>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            {editingLevels.length} levels configured
            {hasChanges && <span className="text-amber-600 ml-2">• Unsaved changes</span>}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
