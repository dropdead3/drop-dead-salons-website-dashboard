import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, DollarSign, TrendingUp, Trophy, Rocket, ClipboardCheck, BarChart3 } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DataHealthSection } from "@/components/dashboard/DataHealthSection";
import { 
  metricsGlossary, 
  MetricCategory, 
  categoryLabels,
  searchMetrics 
} from "@/data/metricsGlossary";

const categoryIcons: Record<MetricCategory, React.ElementType> = {
  sales_revenue: DollarSign,
  forecasting: TrendingUp,
  leaderboard: Trophy,
  client_engine: Rocket,
  onboarding: ClipboardCheck,
  performance: BarChart3,
};

const categories: MetricCategory[] = [
  'sales_revenue',
  'forecasting',
  'leaderboard',
  'client_engine',
  'onboarding',
  'performance',
];

export function MetricsGlossaryContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MetricCategory | "all">("all");

  const filteredMetrics = useMemo(() => {
    let results = metricsGlossary;
    
    // Apply search filter
    if (searchQuery.trim()) {
      results = searchMetrics(searchQuery);
    }
    
    // Apply category filter
    if (selectedCategory !== "all") {
      results = results.filter(m => m.category === selectedCategory);
    }
    
    return results;
  }, [searchQuery, selectedCategory]);

  const metricsByCategory = useMemo(() => {
    const grouped: Record<MetricCategory, typeof filteredMetrics> = {
      sales_revenue: [],
      forecasting: [],
      leaderboard: [],
      client_engine: [],
      onboarding: [],
      performance: [],
    };
    
    filteredMetrics.forEach(metric => {
      grouped[metric.category].push(metric);
    });
    
    return grouped;
  }, [filteredMetrics]);

  const expandedCategories = useMemo(() => {
    if (searchQuery.trim() || selectedCategory !== "all") {
      // Expand categories that have results
      return categories.filter(cat => metricsByCategory[cat].length > 0);
    }
    // Default: expand first category
    return ['sales_revenue'];
  }, [searchQuery, selectedCategory, metricsByCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-medium">Metrics Glossary</h2>
            <p className="text-sm text-muted-foreground">
              Understand how your analytics are calculated
            </p>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search metrics by name, description, or formula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select 
            value={selectedCategory} 
            onValueChange={(v) => setSelectedCategory(v as MetricCategory | "all")}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {categoryLabels[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Results count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{filteredMetrics.length}</Badge>
          <span>metrics found</span>
          {searchQuery && (
            <span>for "{searchQuery}"</span>
          )}
        </div>
      </div>

      {/* Data Health Section */}
      <DataHealthSection />

      {/* Metrics by Category */}
      {filteredMetrics.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No metrics found matching your search.</p>
        </div>
      ) : (
        <Accordion 
          type="multiple" 
          defaultValue={expandedCategories}
          className="space-y-3"
        >
          {categories.map((category) => {
            const metrics = metricsByCategory[category];
            if (metrics.length === 0) return null;
            
            const Icon = categoryIcons[category];
            
            return (
              <AccordionItem 
                key={category} 
                value={category}
                className="border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{categoryLabels[category]}</span>
                    <Badge variant="secondary" className="ml-2">
                      {metrics.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                    {metrics.map((metric) => (
                      <MetricCard key={metric.id} metric={metric} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
