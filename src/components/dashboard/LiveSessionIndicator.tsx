import { cn } from '@/lib/utils';
import { useLiveSessionSnapshot } from '@/hooks/useLiveSessionSnapshot';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

const MAX_AVATARS = 7;
const ENTERPRISE_THRESHOLD = 40;

// TODO: Remove DEMO_MODE before shipping
const DEMO_MODE = true;
const DEMO_STYLISTS = [
  { name: 'Sarah M', photoUrl: null },
  { name: 'Jasmine T', photoUrl: null },
  { name: 'Kira L', photoUrl: null },
  { name: 'Morgan W', photoUrl: null },
  { name: 'Alexa P', photoUrl: null },
  { name: 'Bianca R', photoUrl: null },
  { name: 'Dani C', photoUrl: null },
  { name: 'Elena F', photoUrl: null },
  { name: 'Gina H', photoUrl: null },
  { name: 'Haven J', photoUrl: null },
  { name: 'Ivy K', photoUrl: null },
  { name: 'Jade N', photoUrl: null },
  { name: 'Luna Q', photoUrl: null },
];

export function LiveSessionIndicator() {
  const live = useLiveSessionSnapshot();

  const inSessionCount = DEMO_MODE ? 18 : live.inSessionCount;
  const activeStylistCount = DEMO_MODE ? DEMO_STYLISTS.length : live.activeStylistCount;
  const stylists = DEMO_MODE ? DEMO_STYLISTS : live.stylists;
  const isLoading = DEMO_MODE ? false : live.isLoading;

  if (isLoading || inSessionCount === 0) return null;

  const isEnterprise = activeStylistCount > ENTERPRISE_THRESHOLD;
  const visibleStylists = stylists.slice(0, MAX_AVATARS);
  const overflowCount = activeStylistCount - MAX_AVATARS;

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (name[0] || '?').toUpperCase();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border cursor-default select-none">
            {/* Pulsating green dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>

            {/* Count text */}
            <span className="text-xs font-medium text-foreground whitespace-nowrap font-sans">
              {inSessionCount} In Session
            </span>

            {/* Stacked avatars (hidden for enterprise) */}
            {!isEnterprise && visibleStylists.length > 0 && (
              <div className="flex items-center -space-x-2 ml-1">
                {visibleStylists.map((stylist, i) => (
                  <Avatar
                    key={i}
                    className="h-6 w-6 border-2 border-background"
                  >
                    {stylist.photoUrl ? (
                      <AvatarImage src={stylist.photoUrl} alt={stylist.name} />
                    ) : null}
                    <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                      {getInitials(stylist.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {overflowCount > 0 && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-background bg-muted text-[9px] font-medium text-muted-foreground">
                    +{overflowCount}
                  </div>
                )}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs font-sans">
            {inSessionCount} appointment{inSessionCount !== 1 ? 's' : ''} in progress
            {activeStylistCount > 0 && ` · ${activeStylistCount} stylist${activeStylistCount !== 1 ? 's' : ''} working`}
          </p>
          {stylists.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1 font-sans">
              {stylists.map(s => s.name.split(' ')[0]).join(', ')}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
