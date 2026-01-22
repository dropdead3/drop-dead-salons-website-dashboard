import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronRight, 
  DollarSign, 
  Scissors, 
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BlurredAmount } from '@/contexts/HideNumbersContext';

interface Stylist {
  user_id: string;
  name: string;
  photo_url?: string;
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  totalServices: number;
  totalProducts: number;
  totalTransactions: number;
}

interface StylistSalesRowProps {
  stylist: Stylist;
  rank: number;
  maxRevenue: number;
}

export function StylistSalesRow({ stylist, rank, maxRevenue }: StylistSalesRowProps) {
  const navigate = useNavigate();
  
  const initials = stylist.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  const avgTicket = stylist.totalTransactions > 0 
    ? stylist.totalRevenue / stylist.totalTransactions 
    : 0;

  const revenuePercent = maxRevenue > 0 
    ? (stylist.totalRevenue / maxRevenue) * 100 
    : 0;

  const handleClick = () => {
    navigate(`/dashboard/view-profile/${stylist.user_id}`);
  };

  return (
    <Card 
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Rank & Avatar */}
          <div className="flex items-center gap-3">
            <span className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
              rank === 1 ? 'bg-chart-4/20 text-chart-4' :
              rank === 2 ? 'bg-muted text-muted-foreground' :
              rank === 3 ? 'bg-chart-3/20 text-chart-3' :
              'bg-muted/50 text-muted-foreground'
            )}>
              {rank}
            </span>
            <Avatar className="h-10 w-10">
              <AvatarImage src={stylist.photo_url} alt={stylist.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>

          {/* Name & Revenue bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium truncate">{stylist.name}</p>
              <BlurredAmount className="font-display text-lg">${stylist.totalRevenue.toLocaleString()}</BlurredAmount>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${revenuePercent}%` }}
              />
            </div>
          </div>

          {/* Quick stats - hidden on mobile */}
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <div className="text-center">
              <p className="font-medium text-foreground">{stylist.totalServices}</p>
              <p className="text-xs">Services</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">{stylist.totalProducts}</p>
              <p className="text-xs">Products</p>
            </div>
            <div className="text-center">
              <BlurredAmount className="font-medium text-foreground">${Math.round(avgTicket)}</BlurredAmount>
              <p className="text-xs">Avg</p>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        {/* Mobile stats */}
        <div className="flex md:hidden items-center justify-between mt-3 pt-3 border-t text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Scissors className="w-3 h-3" />
            <span>{stylist.totalServices} services</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <ShoppingBag className="w-3 h-3" />
            <span>{stylist.totalProducts} products</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <BlurredAmount>${Math.round(avgTicket)} avg</BlurredAmount>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
