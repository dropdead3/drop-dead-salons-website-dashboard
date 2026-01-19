import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { stylistLevels } from '@/data/servicePricing';

export function StylistsOverviewCard() {
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

  const levels = stylistLevels;
  const totalAssigned = Object.values(stylistsByLevel || {}).reduce((a, b) => a + b, 0);

  const getStylistCount = (levelId: string): number => {
    return stylistsByLevel?.[levelId] || 0;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm tracking-wide">STYLISTS OVERVIEW</h2>
        <Users className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-3 border-b">
          <span className="text-sm text-muted-foreground">Total Assigned</span>
          <span className="text-2xl font-display font-bold">{totalAssigned}</span>
        </div>
        
        <div className="space-y-2">
          {levels.map((level, idx) => {
            const count = getStylistCount(level.id);
            const percentage = totalAssigned > 0 ? (count / totalAssigned) * 100 : 0;
            
            return (
              <div key={level.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm truncate">{level.label}</span>
                    <span className="text-sm text-muted-foreground shrink-0">{count}</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-foreground/30 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {totalAssigned === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            No stylists assigned to levels yet
          </p>
        )}
      </div>
    </Card>
  );
}
