import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Scissors, 
  Plus, 
  Pencil, 
  Trash2, 
  Star,
  Sparkles,
  Search,
  Palette,
  Layers,
  Settings2,
  GripVertical,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { services as initialServices, type ServiceCategory, type ServiceItem } from '@/data/servicePricing';
import { StylistLevelsEditor } from '@/components/dashboard/StylistLevelsEditor';
import { useStylistLevelsSimple } from '@/hooks/useStylistLevels';

export function ServicesContent() {
  const { data: stylistLevels } = useStylistLevelsSimple();
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(initialServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingService, setEditingService] = useState<{ categoryIndex: number; itemIndex: number; item: ServiceItem } | null>(null);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState<number | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIsAddOn, setNewCategoryIsAddOn] = useState(false);

  const totalServices = serviceCategories.reduce((sum, cat) => sum + cat.items.length, 0);
  const popularServices = serviceCategories.reduce(
    (sum, cat) => sum + cat.items.filter(item => item.isPopular).length, 
    0
  );

  const handleTogglePopular = (categoryIndex: number, itemIndex: number) => {
    setServiceCategories(prev => {
      const updated = [...prev];
      updated[categoryIndex] = {
        ...updated[categoryIndex],
        items: updated[categoryIndex].items.map((item, idx) => 
          idx === itemIndex ? { ...item, isPopular: !item.isPopular } : item
        ),
      };
      return updated;
    });
  };

  const handleRenameCategory = (index: number) => {
    if (!editingCategoryName.trim()) return;
    setServiceCategories(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], category: editingCategoryName.trim() };
      return updated;
    });
    setEditingCategoryIndex(null);
    setEditingCategoryName('');
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCategory: ServiceCategory = {
      category: newCategoryName.trim(),
      description: '',
      isAddOn: newCategoryIsAddOn,
      items: [],
    };
    setServiceCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
    setNewCategoryIsAddOn(false);
    setIsAddCategoryOpen(false);
  };

  const handleDeleteCategory = (index: number) => {
    setServiceCategories(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategoryDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCategoryIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCategoryIndex !== null && draggedCategoryIndex !== index) {
      setDragOverCategoryIndex(index);
    }
  };

  const handleCategoryDragLeave = () => {
    setDragOverCategoryIndex(null);
  };

  const handleCategoryDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedCategoryIndex === null || draggedCategoryIndex === targetIndex) {
      setDraggedCategoryIndex(null);
      setDragOverCategoryIndex(null);
      return;
    }

    setServiceCategories(prev => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(draggedCategoryIndex, 1);
      updated.splice(targetIndex, 0, draggedItem);
      return updated;
    });

    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
  };

  const handleCategoryDragEnd = () => {
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
  };

  const filteredCategories = searchQuery
    ? serviceCategories.map(category => ({
        ...category,
        items: category.items.filter(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.items.length > 0)
    : serviceCategories;

  const getCategoryIcon = (category: string) => {
    if (category.includes('Cut') || category.includes('Styling')) return Scissors;
    if (category.includes('Color') || category.includes('Balayage') || category.includes('Highlight')) return Palette;
    if (category.includes('Extension')) return Layers;
    return Sparkles;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-display flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Services Manager
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage your salon services and pricing
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <StylistLevelsEditor
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="w-4 h-4" />
                Manage Levels
              </Button>
            }
          />
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new service category
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input 
                    placeholder="e.g. Bridal Services"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                    }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="add-on-toggle"
                    checked={newCategoryIsAddOn}
                    onCheckedChange={setNewCategoryIsAddOn}
                  />
                  <Label htmlFor="add-on-toggle" className="cursor-pointer">
                    This is an Add-On category
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                  Add Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Scissors className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalServices}</p>
              <p className="text-sm text-muted-foreground">Total Services</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{serviceCategories.length}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
        <Link to="/dashboard/admin/stylist-levels">
          <Card className="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-primary/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Settings2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stylistLevels || []).length}</p>
                <p className="text-sm text-muted-foreground">Stylist Levels</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{popularServices}</p>
              <p className="text-sm text-muted-foreground">Popular Services</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Service Categories */}
      <Accordion type="multiple" className="space-y-3">
        {filteredCategories.map((category, idx) => {
          const CategoryIcon = getCategoryIcon(category.category);
          const originalCategoryIndex = serviceCategories.findIndex(c => c.category === category.category);
          const isEditing = editingCategoryIndex === originalCategoryIndex;
          const isDragging = draggedCategoryIndex === originalCategoryIndex;
          const isDragOver = dragOverCategoryIndex === originalCategoryIndex;
          
          return (
            <AccordionItem 
              key={category.category} 
              value={category.category}
              className={cn(
                "border rounded-lg overflow-hidden transition-all group",
                isDragging && "opacity-50",
                isDragOver && "ring-2 ring-primary ring-offset-2"
              )}
              draggable={!searchQuery}
              onDragStart={(e) => handleCategoryDragStart(e, originalCategoryIndex)}
              onDragOver={(e) => handleCategoryDragOver(e, originalCategoryIndex)}
              onDragLeave={handleCategoryDragLeave}
              onDrop={(e) => handleCategoryDrop(e, originalCategoryIndex)}
              onDragEnd={handleCategoryDragEnd}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 [&>svg]:shrink-0">
                <div className="flex items-center gap-3 flex-1">
                  {!searchQuery && (
                    <div 
                      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}
                  <div className="p-2 rounded-lg bg-muted">
                    <CategoryIcon className="w-4 h-4 text-foreground" />
                  </div>
                  {isEditing ? (
                    <div 
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        className="h-8 w-48"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameCategory(originalCategoryIndex);
                          } else if (e.key === 'Escape') {
                            setEditingCategoryIndex(null);
                            setEditingCategoryName('');
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRenameCategory(originalCategoryIndex)}
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingCategoryIndex(null);
                          setEditingCategoryName('');
                        }}
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-left">
                        <h3 className="font-display font-medium uppercase tracking-wide">{category.category}</h3>
                        <p className="text-xs text-muted-foreground font-sans font-normal">
                          {category.items.length} services
                        </p>
                      </div>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategoryIndex(originalCategoryIndex);
                            setEditingCategoryName(category.category);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{category.category}" and all {category.items.length} services in it.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(originalCategoryIndex)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mr-2">
                  {category.isAddOn && (
                    <Badge variant="outline" className="text-xs">Add-On</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 pt-2">
                  {category.items.map((item, itemIdx) => (
                    <div 
                      key={item.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleTogglePopular(originalCategoryIndex, itemIdx)}
                          className="p-1"
                        >
                          <Star 
                            className={cn(
                              "w-4 h-4 transition-colors",
                              item.isPopular 
                                ? "fill-amber-400 text-amber-400" 
                                : "text-muted-foreground hover:text-amber-400"
                            )} 
                          />
                        </button>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.prices && Object.keys(item.prices).length > 0 && (
                          <span className="text-sm font-medium">{Object.values(item.prices)[0]}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {category.items.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No services in this category yet
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
