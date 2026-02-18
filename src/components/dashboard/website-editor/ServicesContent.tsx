import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Scissors, 
  Star,
  Sparkles,
  Search,
  Palette,
  Layers,
  Settings2,
  GripVertical,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StylistLevelsEditor } from '@/components/dashboard/StylistLevelsEditor';
import { useStylistLevelsSimple } from '@/hooks/useStylistLevels';
import {
  useNativeServicesForWebsite,
  useToggleServicePopular,
  type NativeServiceCategory,
} from '@/hooks/useNativeServicesForWebsite';

export function ServicesContent() {
  const { data: stylistLevels } = useStylistLevelsSimple();
  const { categories, levels, isLoading, hasLevelPrices, error } = useNativeServicesForWebsite();
  const togglePopular = useToggleServicePopular();

  const [searchQuery, setSearchQuery] = useState('');

  const totalServices = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const popularServices = categories.reduce(
    (sum, cat) => sum + cat.items.filter(item => item.isPopular).length, 
    0
  );

  const handleTogglePopular = (serviceId: string, currentValue: boolean) => {
    togglePopular.mutate({ serviceId, isPopular: !currentValue });
  };

  const filteredCategories: NativeServiceCategory[] = searchQuery
    ? categories.map(category => ({
        ...category,
        items: category.items.filter(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.items.length > 0)
    : categories;

  const getCategoryIcon = (category: string) => {
    if (category.includes('Cut') || category.includes('Haircut')) return Scissors;
    if (category.includes('Color') || category.includes('Blonding') || category.includes('Vivid')) return Palette;
    if (category.includes('Extension')) return Layers;
    return Sparkles;
  };

  const formatPrice = (price: number) => `$${Math.round(price)}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading services...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Failed to load services. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-display flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Services Manager
          </h2>
          <p className="text-muted-foreground text-sm">
            View and manage your salon services. Edit services in{' '}
            <Link to="/dashboard/settings/services" className="text-primary underline underline-offset-2">
              Settings → Services
            </Link>
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
        </div>
      </div>

      {/* Data health warning */}
      {!hasLevelPrices && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Level-based pricing has not been configured yet. Services are showing base prices only.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Scissors className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-medium">{totalServices}</p>
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
              <p className="text-2xl font-medium">{categories.length}</p>
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
                <p className="text-2xl font-medium">{(stylistLevels || []).length}</p>
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
              <p className="text-2xl font-medium">{popularServices}</p>
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
        {filteredCategories.map((category) => {
          const CategoryIcon = getCategoryIcon(category.categoryName);
          
          return (
            <AccordionItem 
              key={category.id} 
              value={category.id}
              className="border rounded-lg overflow-hidden transition-all group"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 [&>svg]:shrink-0">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-muted">
                    <CategoryIcon className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-display font-medium uppercase tracking-wide">{category.categoryName}</h3>
                    <p className="text-xs text-muted-foreground font-sans font-normal">
                      {category.items.length} services
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {/* Level price header */}
                {hasLevelPrices && levels.length > 0 && (
                  <div className="flex items-center gap-2 py-2 px-3 mb-2 bg-muted/30 rounded text-xs text-muted-foreground">
                    <span className="flex-1">Service</span>
                    {levels.map((level) => (
                      <span key={level.id} className="w-16 text-center font-medium">
                        {level.clientLabel}
                      </span>
                    ))}
                  </div>
                )}
                <div className="space-y-2 pt-2">
                  {category.items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => handleTogglePopular(item.id, item.isPopular)}
                          className="p-1 shrink-0"
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
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          {(item.websiteDescription || item.description) && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.websiteDescription || item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasLevelPrices && levels.length > 0 ? (
                          levels.map((level) => (
                            <span key={level.id} className="w-16 text-center text-sm font-medium">
                              {item.levelPrices[level.id] != null
                                ? formatPrice(item.levelPrices[level.id])
                                : '—'}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm font-medium">
                            {formatPrice(item.basePrice)}
                          </span>
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
