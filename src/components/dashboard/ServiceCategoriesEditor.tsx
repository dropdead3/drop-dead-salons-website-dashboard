import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Plus, 
  Pencil, 
  Trash2, 
  FolderOpen,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ServiceCategory } from '@/data/servicePricing';

interface ServiceCategoriesEditorProps {
  categories: ServiceCategory[];
  onCategoriesChange: (categories: ServiceCategory[]) => void;
  trigger?: React.ReactNode;
}

export function ServiceCategoriesEditor({ 
  categories, 
  onCategoriesChange,
  trigger 
}: ServiceCategoriesEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategories, setEditingCategories] = useState<ServiceCategory[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', isAddOn: false });

  const handleOpen = (open: boolean) => {
    if (open) {
      setEditingCategories([...categories.map(c => ({ ...c, items: [...c.items] }))]);
    }
    setIsOpen(open);
    setEditingIndex(null);
    setIsAddingNew(false);
    setNewCategory({ name: '', description: '', isAddOn: false });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newCategories = [...editingCategories];
    [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
    setEditingCategories(newCategories);
  };

  const handleMoveDown = (index: number) => {
    if (index === editingCategories.length - 1) return;
    const newCategories = [...editingCategories];
    [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
    setEditingCategories(newCategories);
  };

  const handleUpdate = (index: number, updates: Partial<ServiceCategory>) => {
    const newCategories = [...editingCategories];
    newCategories[index] = {
      ...newCategories[index],
      ...updates,
    };
    setEditingCategories(newCategories);
  };

  const handleDelete = (index: number) => {
    setEditingCategories(editingCategories.filter((_, idx) => idx !== index));
  };

  const handleAddNew = () => {
    if (!newCategory.name.trim()) return;
    
    const newCat: ServiceCategory = {
      category: newCategory.name.trim(),
      description: newCategory.description.trim(),
      isAddOn: newCategory.isAddOn,
      items: [],
    };
    
    setEditingCategories([...editingCategories, newCat]);
    setNewCategory({ name: '', description: '', isAddOn: false });
    setIsAddingNew(false);
  };

  const handleSave = () => {
    onCategoriesChange(editingCategories);
    setIsOpen(false);
  };

  const hasChanges = JSON.stringify(categories) !== JSON.stringify(editingCategories);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Manage Categories
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Service Categories Editor
          </DialogTitle>
          <DialogDescription>
            Add, remove, rename, or reorder service categories. Services within categories will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {editingCategories.map((category, index) => (
            <div
              key={`${category.category}-${index}`}
              className={cn(
                "p-3 rounded-lg border bg-card transition-colors",
                editingIndex === index && "ring-2 ring-primary"
              )}
            >
              {editingIndex === index ? (
                // Edit mode
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Category Name</Label>
                    <Input
                      value={category.category}
                      onChange={(e) => handleUpdate(index, { category: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={category.description}
                      onChange={(e) => handleUpdate(index, { description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`addon-${index}`}
                        checked={category.isAddOn || false}
                        onCheckedChange={(checked) => handleUpdate(index, { isAddOn: checked })}
                      />
                      <Label htmlFor={`addon-${index}`} className="text-sm">Add-On Category</Label>
                    </div>
                    <Button size="sm" onClick={() => setEditingIndex(null)}>
                      <Save className="w-4 h-4 mr-1" />
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                // Display mode
                <div className="flex items-start gap-2">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 shrink-0">
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
                      disabled={index === editingCategories.length - 1}
                      onClick={() => handleMoveDown(index)}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Category info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{category.category}</h4>
                      {category.isAddOn && (
                        <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                          Add-On
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {category.items.length} services
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
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
                          disabled={category.items.length > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{category.category}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this category. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(index)}
                          >
                            Delete Category
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add new category */}
          {isAddingNew ? (
            <div className="p-3 rounded-lg border border-dashed bg-muted/50 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Category Name</Label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name..."
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this category..."
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="addon-new"
                    checked={newCategory.isAddOn}
                    onCheckedChange={(checked) => setNewCategory(prev => ({ ...prev, isAddOn: checked }))}
                  />
                  <Label htmlFor="addon-new" className="text-sm">Add-On Category</Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewCategory({ name: '', description: '', isAddOn: false });
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddNew}
                    disabled={!newCategory.name.trim()}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="w-4 h-4" />
              Add New Category
            </Button>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
          <p className="text-xs text-muted-foreground flex-1">
            {editingCategories.length} categories
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
