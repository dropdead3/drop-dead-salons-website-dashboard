import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  DollarSign,
  Star,
  Sparkles,
  ChevronRight,
  Search,
  Palette,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { services as initialServices, stylistLevels, type ServiceCategory, type ServiceItem } from '@/data/servicePricing';

export default function ServicesManager() {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(initialServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingService, setEditingService] = useState<{ categoryIndex: number; itemIndex: number; item: ServiceItem } | null>(null);

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

  const handleUpdateService = () => {
    if (!editingService) return;
    
    setServiceCategories(prev => {
      const updated = [...prev];
      updated[editingService.categoryIndex] = {
        ...updated[editingService.categoryIndex],
        items: updated[editingService.categoryIndex].items.map((item, idx) => 
          idx === editingService.itemIndex ? editingService.item : item
        ),
      };
      return updated;
    });
    setEditingService(null);
  };

  const filteredCategories = serviceCategories.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.items.length > 0);

  const getCategoryIcon = (category: string) => {
    if (category.includes('Cut') || category.includes('Styling')) return Scissors;
    if (category.includes('Color') || category.includes('Balayage') || category.includes('Highlight')) return Palette;
    if (category.includes('Extension')) return Layers;
    return Sparkles;
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Scissors className="w-6 h-6" />
              Services Manager
            </h1>
            <p className="text-muted-foreground">
              Manage your salon services and pricing
            </p>
          </div>
          
          <Button className="gap-2" disabled>
            <Plus className="w-4 h-4" />
            Add Service
            <Badge variant="secondary" className="ml-1">Coming Soon</Badge>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
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
          {filteredCategories.map((category, categoryIndex) => {
            const CategoryIcon = getCategoryIcon(category.category);
            const originalCategoryIndex = serviceCategories.findIndex(c => c.category === category.category);
            
            return (
              <AccordionItem 
                key={category.category} 
                value={category.category}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "p-2 rounded-lg",
                      category.isAddOn 
                        ? "bg-green-100 dark:bg-green-900/30" 
                        : "bg-muted"
                    )}>
                      <CategoryIcon className={cn(
                        "w-4 h-4",
                        category.isAddOn ? "text-green-600" : "text-foreground"
                      )} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-display font-medium">{category.category}</h3>
                      <p className="text-xs text-muted-foreground font-normal">
                        {category.items.length} services
                      </p>
                    </div>
                    {category.isAddOn && (
                      <Badge variant="outline" className="ml-2 text-green-600 border-green-300">
                        Add-On
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <div className="divide-y border-t">
                    {category.items.map((item, itemIndex) => {
                      const originalItemIndex = serviceCategories[originalCategoryIndex]?.items.findIndex(
                        i => i.name === item.name
                      ) ?? itemIndex;
                      
                      return (
                        <div 
                          key={item.name}
                          className="px-4 py-3 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              {item.isPopular && (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 gap-1">
                                  <Star className="w-3 h-3 fill-current" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">Starts at:</span>
                              <Badge variant="secondary" className="font-mono">
                                {item.prices['new-talent']}
                              </Badge>
                              <ChevronRight className="w-3 h-3 text-muted-foreground" />
                              <Badge variant="secondary" className="font-mono">
                                {item.prices['icon']}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`popular-${item.name}`} className="text-xs text-muted-foreground">
                                Popular
                              </Label>
                              <Switch
                                id={`popular-${item.name}`}
                                checked={item.isPopular}
                                onCheckedChange={() => handleTogglePopular(originalCategoryIndex, originalItemIndex)}
                              />
                            </div>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingService({ 
                                    categoryIndex: originalCategoryIndex, 
                                    itemIndex: originalItemIndex, 
                                    item: { ...item } 
                                  })}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Service</DialogTitle>
                                  <DialogDescription>
                                    Update service details and pricing
                                  </DialogDescription>
                                </DialogHeader>
                                {editingService && (
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Service Name</Label>
                                      <Input 
                                        value={editingService.item.name}
                                        onChange={(e) => setEditingService(prev => 
                                          prev ? { ...prev, item: { ...prev.item, name: e.target.value } } : null
                                        )}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Description</Label>
                                      <Textarea 
                                        value={editingService.item.description || ''}
                                        onChange={(e) => setEditingService(prev => 
                                          prev ? { ...prev, item: { ...prev.item, description: e.target.value } } : null
                                        )}
                                        rows={2}
                                      />
                                    </div>
                                    <div className="space-y-3">
                                      <Label>Pricing by Level</Label>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {stylistLevels.map((level, index) => (
                                          <div key={level.id} className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                              Level {index + 1} - {level.label}
                                            </Label>
                                            <div className="relative">
                                              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                              <Input 
                                                className="pl-7 font-mono"
                                                value={editingService.item.prices[level.id]?.replace('$', '') || ''}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  setEditingService(prev => 
                                                    prev ? { 
                                                      ...prev, 
                                                      item: { 
                                                        ...prev.item, 
                                                        prices: { 
                                                          ...prev.item.prices, 
                                                          [level.id]: value ? `$${value}` : null 
                                                        } 
                                                      } 
                                                    } : null
                                                  );
                                                }}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEditingService(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleUpdateService}>
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              About Service Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Stylist Levels:</strong> Prices vary by stylist experience level, from New Talent to Icon Artist.
            </p>
            <p>
              <strong className="text-foreground">Popular Flag:</strong> Toggle to feature services prominently on the website.
            </p>
            <p>
              <strong className="text-foreground">Note:</strong> Changes made here are currently local only. Database integration coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}