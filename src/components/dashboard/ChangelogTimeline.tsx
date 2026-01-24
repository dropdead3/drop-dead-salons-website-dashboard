import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, getYear, getQuarter } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Star, Clock, Rocket, Bug, Sparkles, Lightbulb, ChevronRight, ExternalLink } from 'lucide-react';
import type { ChangelogEntry } from '@/hooks/useChangelog';

const ENTRY_TYPE_CONFIG: Record<string, { icon: typeof Sparkles; label: string; color: string; dotColor: string }> = {
  update: { icon: Sparkles, label: 'Update', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
  feature: { icon: Rocket, label: 'Feature', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  bugfix: { icon: Bug, label: 'Bug Fix', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
  improvement: { icon: Lightbulb, label: 'Improvement', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-500' },
  coming_soon: { icon: Clock, label: 'Coming Soon', color: 'bg-purple-100 text-purple-700', dotColor: 'bg-purple-500' },
};

interface ChangelogTimelineProps {
  entries: ChangelogEntry[];
}

export function ChangelogTimeline({ entries }: ChangelogTimelineProps) {
  const [selectedEntry, setSelectedEntry] = useState<ChangelogEntry | null>(null);

  // Group entries by year and quarter
  const groupedEntries = useMemo(() => {
    const groups: Record<string, { label: string; entries: ChangelogEntry[] }> = {};
    
    entries.forEach(entry => {
      const date = entry.published_at ? parseISO(entry.published_at) : new Date();
      const year = getYear(date);
      const quarter = getQuarter(date);
      const key = `${year}-Q${quarter}`;
      
      if (!groups[key]) {
        groups[key] = {
          label: `Q${quarter} ${year}`,
          entries: [],
        };
      }
      groups[key].entries.push(entry);
    });

    // Sort groups by date (newest first)
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, value]) => ({ key, ...value }));
  }, [entries]);

  // Filter for major releases and coming soon for the horizontal timeline
  const timelineItems = useMemo(() => {
    return entries
      .filter(e => e.is_major || e.entry_type === 'coming_soon')
      .sort((a, b) => {
        const dateA = a.published_at || a.release_date || a.created_at;
        const dateB = b.published_at || b.release_date || b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 10);
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No changelog entries yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Horizontal Timeline - Major Releases */}
      {timelineItems.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">MAJOR MILESTONES</h3>
            <ScrollArea className="w-full">
              <div className="relative pb-4">
                {/* Timeline line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
                
                {/* Timeline items */}
                <div className="flex gap-8 relative">
                  {timelineItems.map((entry, index) => {
                    const typeConfig = ENTRY_TYPE_CONFIG[entry.entry_type] || ENTRY_TYPE_CONFIG.update;
                    const isComingSoon = entry.entry_type === 'coming_soon';
                    const date = entry.published_at || entry.release_date || entry.created_at;
                    
                    return (
                      <button
                        key={entry.id}
                        onClick={() => setSelectedEntry(entry)}
                        className={cn(
                          'flex flex-col items-center min-w-[100px] group',
                          selectedEntry?.id === entry.id && 'scale-105'
                        )}
                      >
                        {/* Dot */}
                        <div className={cn(
                          'w-4 h-4 rounded-full border-2 border-background z-10 transition-transform group-hover:scale-125',
                          isComingSoon ? 'bg-background border-purple-500 ring-2 ring-purple-500/20' : typeConfig.dotColor
                        )}>
                          {entry.is_major && (
                            <Star className="h-2.5 w-2.5 text-white absolute top-0.5 left-0.5" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="mt-3 text-center">
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(date), 'MMM d')}
                          </p>
                          {entry.version && (
                            <p className="text-xs font-medium">{entry.version}</p>
                          )}
                          <p className="text-sm font-medium line-clamp-2 max-w-[100px] mt-1">
                            {entry.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Selected Entry Detail */}
      <AnimatePresence mode="wait">
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedEntry.is_major && (
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      )}
                      <Badge className={cn('text-xs', ENTRY_TYPE_CONFIG[selectedEntry.entry_type]?.color)}>
                        {ENTRY_TYPE_CONFIG[selectedEntry.entry_type]?.label}
                      </Badge>
                      {selectedEntry.version && (
                        <Badge variant="outline">{selectedEntry.version}</Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{selectedEntry.title}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedEntry.content}</p>
                    
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      {selectedEntry.published_at && (
                        <span>{format(parseISO(selectedEntry.published_at), 'MMMM d, yyyy')}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEntry(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vertical Timeline by Quarter */}
      <div className="space-y-6">
        {groupedEntries.map(group => (
          <div key={group.key}>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 sticky top-0 bg-background py-2">
              {group.label}
            </h3>
            <div className="relative pl-6 border-l-2 border-border space-y-4">
              {group.entries.map(entry => {
                const typeConfig = ENTRY_TYPE_CONFIG[entry.entry_type] || ENTRY_TYPE_CONFIG.update;
                const TypeIcon = typeConfig.icon;
                const date = entry.published_at || entry.created_at;
                
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative"
                  >
                    {/* Dot on timeline */}
                    <div className={cn(
                      'absolute -left-[29px] w-3 h-3 rounded-full',
                      typeConfig.dotColor
                    )} />
                    
                    <Card
                      className={cn(
                        'cursor-pointer hover:shadow-md transition-shadow',
                        selectedEntry?.id === entry.id && 'ring-2 ring-primary'
                      )}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {entry.is_major && (
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              )}
                              <Badge className={cn('text-xs', typeConfig.color)}>
                                <TypeIcon className="h-3 w-3 mr-1" />
                                {typeConfig.label}
                              </Badge>
                              {entry.version && (
                                <span className="text-xs text-muted-foreground">{entry.version}</span>
                              )}
                            </div>
                            <h4 className="font-medium">{entry.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {entry.content}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(date), 'MMM d')}
                            </p>
                            <ChevronRight className="h-4 w-4 text-muted-foreground mt-2 ml-auto" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
