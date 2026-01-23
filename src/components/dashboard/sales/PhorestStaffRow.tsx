import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  Link2, 
  Scissors, 
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BlurredAmount } from '@/contexts/HideNumbersContext';

export interface PhorestStaffData {
  phorestStaffId: string;
  phorestStaffName: string;
  branchName?: string;
  isMapped: boolean;
  linkedUserId?: string;
  linkedUserName?: string;
  linkedUserPhoto?: string;
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  totalServices: number;
  totalProducts: number;
  totalTransactions: number;
}

interface PhorestStaffRowProps {
  staff: PhorestStaffData;
  rank: number;
  maxRevenue: number;
  onLinkClick?: (staff: PhorestStaffData) => void;
}

export function PhorestStaffRow({ staff, rank, maxRevenue, onLinkClick }: PhorestStaffRowProps) {
  const navigate = useNavigate();
  
  const displayName = staff.isMapped ? staff.linkedUserName : staff.phorestStaffName;
  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  const avgTicket = staff.totalTransactions > 0 
    ? staff.totalRevenue / staff.totalTransactions 
    : 0;

  const revenuePercent = maxRevenue > 0 
    ? (staff.totalRevenue / maxRevenue) * 100 
    : 0;

  const handleClick = () => {
    if (staff.isMapped && staff.linkedUserId) {
      navigate(`/dashboard/view-profile/${staff.linkedUserId}`);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLinkClick?.(staff);
  };

  return (
    <Card 
      className={cn(
        "group transition-all",
        staff.isMapped && "cursor-pointer hover:shadow-md hover:border-primary/20",
        !staff.isMapped && "border-dashed border-muted-foreground/30"
      )}
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
            <Avatar className={cn("h-10 w-10", !staff.isMapped && "opacity-60")}>
              {staff.isMapped ? (
                <AvatarImage src={staff.linkedUserPhoto} alt={displayName} />
              ) : null}
              <AvatarFallback className={!staff.isMapped ? "bg-muted" : undefined}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name & Revenue bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <p className={cn(
                  "font-medium truncate",
                  !staff.isMapped && "text-muted-foreground"
                )}>
                  {displayName}
                </p>
                {staff.branchName && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    ({staff.branchName})
                  </span>
                )}
              </div>
              <BlurredAmount className="font-display text-lg shrink-0">
                ${staff.totalRevenue.toLocaleString()}
              </BlurredAmount>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  staff.isMapped ? "bg-primary" : "bg-muted-foreground/50"
                )}
                style={{ width: `${revenuePercent}%` }}
              />
            </div>
          </div>

          {/* Status badge */}
          <div className="hidden sm:block">
            {staff.isMapped ? (
              <Badge variant="outline" className="gap-1 text-chart-2 border-chart-2/30 bg-chart-2/5">
                <CheckCircle2 className="w-3 h-3" />
                Linked
              </Badge>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-1 h-7"
                onClick={handleLinkClick}
              >
                <Link2 className="w-3 h-3" />
                Link
              </Button>
            )}
          </div>

          {/* Quick stats - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
            <div className="text-center">
              <p className="font-medium text-foreground">{staff.totalServices}</p>
              <p className="text-xs">Services</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">{staff.totalProducts}</p>
              <p className="text-xs">Products</p>
            </div>
            <div className="text-center">
              <BlurredAmount className="font-medium text-foreground">${Math.round(avgTicket)}</BlurredAmount>
              <p className="text-xs">Avg</p>
            </div>
          </div>

          {/* Arrow - only for mapped */}
          {staff.isMapped && (
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>

        {/* Mobile stats & link button */}
        <div className="flex md:hidden items-center justify-between mt-3 pt-3 border-t text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Scissors className="w-3 h-3" />
              <span>{staff.totalServices}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <ShoppingBag className="w-3 h-3" />
              <span>{staff.totalProducts}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <BlurredAmount>${Math.round(avgTicket)}</BlurredAmount>
            </div>
          </div>
          {!staff.isMapped && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1 h-6 text-xs"
              onClick={handleLinkClick}
            >
              <Link2 className="w-3 h-3" />
              Link
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
