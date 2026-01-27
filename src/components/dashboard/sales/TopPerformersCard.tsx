import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal } from 'lucide-react';
import { BlurredAmount } from '@/contexts/HideNumbersContext';
import { MetricInfoTooltip } from '@/components/ui/MetricInfoTooltip';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';

interface Performer {
  user_id: string;
  name: string;
  photo_url?: string;
  totalRevenue: number;
}

interface TopPerformersCardProps {
  performers: Performer[];
  isLoading?: boolean;
  showInfoTooltip?: boolean;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-4 h-4 text-chart-4" />;
    case 2:
      return <Medal className="w-4 h-4 text-muted-foreground" />;
    case 3:
      return <Medal className="w-4 h-4 text-chart-3" />;
    default:
      return null;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-chart-4/10 border-chart-4/20';
    case 2:
      return 'bg-muted/50 border-muted-foreground/20';
    case 3:
      return 'bg-chart-3/10 border-chart-3/20';
    default:
      return 'bg-muted/30';
  }
};

export function TopPerformersCard({ performers, isLoading, showInfoTooltip = false }: TopPerformersCardProps) {
  const headerContent = (
    <div className="flex items-center gap-2">
      <Trophy className="w-5 h-5 text-chart-4" />
      <CardTitle className="font-display text-base">Top Performers</CardTitle>
      <CommandCenterVisibilityToggle 
        elementKey="top_performers" 
        elementName="Top Performers" 
      />
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">{headerContent}</CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performers.length) {
    return (
      <Card>
        <CardHeader className="pb-2">{headerContent}</CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground text-sm">
            No sales data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const topThree = performers.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2">{headerContent}</CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topThree.map((performer, idx) => {
            const rank = idx + 1;
            const initials = performer.name
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase() || '?';

            return (
              <div
                key={performer.user_id}
                className={`flex items-center gap-3 p-2 rounded-lg border ${getRankBg(rank)}`}
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={performer.photo_url} alt={performer.name} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1">
                    {getRankIcon(rank)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{performer.name}</p>
                  <BlurredAmount className="text-xs text-muted-foreground">
                    ${performer.totalRevenue.toLocaleString()}
                  </BlurredAmount>
                </div>
                <Badge variant="outline" className="text-xs">
                  #{rank}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
