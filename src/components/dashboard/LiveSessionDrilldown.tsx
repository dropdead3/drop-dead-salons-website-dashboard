import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock } from 'lucide-react';
import { DRILLDOWN_DIALOG_CONTENT_CLASS, DRILLDOWN_OVERLAY_CLASS } from './drilldownDialogStyles';
import { tokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import type { StylistDetail } from '@/hooks/useLiveSessionSnapshot';

// Demo data
const DEMO_DETAILS: StylistDetail[] = [
  { name: 'Sarah M', photoUrl: null, currentService: 'Balayage & Tone', currentEndTime: '14:30:00', lastEndTime: '17:00:00', currentApptIndex: 3, totalAppts: 5, assistedBy: 'Jamie R' },
  { name: 'Jasmine T', photoUrl: null, currentService: 'Haircut & Style', currentEndTime: '13:45:00', lastEndTime: '17:30:00', currentApptIndex: 2, totalAppts: 6, assistedBy: null },
  { name: 'Kira L', photoUrl: null, currentService: 'Root Touch-Up', currentEndTime: '14:00:00', lastEndTime: '18:00:00', currentApptIndex: 4, totalAppts: 7, assistedBy: null },
  { name: 'Morgan W', photoUrl: null, currentService: 'Extensions Install', currentEndTime: '15:00:00', lastEndTime: '18:00:00', currentApptIndex: 1, totalAppts: 3, assistedBy: 'Taylor K' },
  { name: 'Alexa P', photoUrl: null, currentService: 'Blowout', currentEndTime: '13:30:00', lastEndTime: '18:30:00', currentApptIndex: 5, totalAppts: 8, assistedBy: null },
  { name: 'Bianca R', photoUrl: null, currentService: 'Highlights', currentEndTime: '14:15:00', lastEndTime: '18:30:00', currentApptIndex: 2, totalAppts: 5, assistedBy: null },
  { name: 'Dani C', photoUrl: null, currentService: 'Brazilian Blowout', currentEndTime: '14:45:00', lastEndTime: '19:00:00', currentApptIndex: 3, totalAppts: 6, assistedBy: 'Jamie R' },
  { name: 'Elena F', photoUrl: null, currentService: 'Color Correction', currentEndTime: '15:30:00', lastEndTime: '19:00:00', currentApptIndex: 4, totalAppts: 7, assistedBy: null },
  { name: 'Gina H', photoUrl: null, currentService: 'Keratin Treatment', currentEndTime: '14:00:00', lastEndTime: '19:30:00', currentApptIndex: 2, totalAppts: 4, assistedBy: null },
  { name: 'Haven J', photoUrl: null, currentService: 'Men\'s Cut', currentEndTime: '13:15:00', lastEndTime: '19:30:00', currentApptIndex: 6, totalAppts: 9, assistedBy: null },
  { name: 'Ivy K', photoUrl: null, currentService: 'Updo', currentEndTime: '14:30:00', lastEndTime: '20:00:00', currentApptIndex: 3, totalAppts: 5, assistedBy: 'Taylor K' },
  { name: 'Jade N', photoUrl: null, currentService: 'Gloss Treatment', currentEndTime: '13:45:00', lastEndTime: '20:00:00', currentApptIndex: 1, totalAppts: 4, assistedBy: null },
  { name: 'Luna Q', photoUrl: null, currentService: 'Full Color', currentEndTime: '14:00:00', lastEndTime: '20:30:00', currentApptIndex: 2, totalAppts: 6, assistedBy: null },
];

const DEMO_MODE = true;

function formatTimeDisplay(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] || '?').toUpperCase();
}

interface LiveSessionDrilldownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inSessionCount: number;
  activeStylistCount: number;
  stylistDetails: StylistDetail[];
}

export function LiveSessionDrilldown({
  open,
  onOpenChange,
  inSessionCount,
  activeStylistCount,
  stylistDetails,
}: LiveSessionDrilldownProps) {
  const details = DEMO_MODE ? DEMO_DETAILS : stylistDetails;
  const sessionCount = DEMO_MODE ? 18 : inSessionCount;
  const stylistCount = DEMO_MODE ? DEMO_DETAILS.length : activeStylistCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={DRILLDOWN_DIALOG_CONTENT_CLASS} overlayClassName={DRILLDOWN_OVERLAY_CLASS}>
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <DialogTitle className={cn(tokens.heading.section, 'text-sm')}>Happening Now</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1.5">
            {sessionCount} appointment{sessionCount !== 1 ? 's' : ''} in progress · {stylistCount} stylist{stylistCount !== 1 ? 's' : ''} working
          </DialogDescription>
        </DialogHeader>

        {/* Gradient divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Stylist list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="py-1">
            {details.map((stylist, i) => {
              const progress = stylist.totalAppts > 0
                ? (stylist.currentApptIndex / stylist.totalAppts) * 100
                : 0;

              return (
                <div
                  key={i}
                  className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <Avatar className="h-9 w-9 shrink-0 border border-border">
                    {stylist.photoUrl ? (
                      <AvatarImage src={stylist.photoUrl} alt={stylist.name} />
                    ) : null}
                    <AvatarFallback className="text-[10px] bg-muted text-muted-foreground rounded-lg">
                      {getInitials(stylist.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{stylist.name}</p>
                    {stylist.currentService && (
                      <p className="text-xs text-muted-foreground truncate">{stylist.currentService}</p>
                    )}
                    {stylist.assistedBy && (
                      <p className="text-[10px] italic text-muted-foreground/80 truncate">
                        Assisted by {stylist.assistedBy}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      Appointment {stylist.currentApptIndex} of {stylist.totalAppts}
                    </p>
                    {/* Progress bar */}
                    <div className="h-1 w-full bg-border/50 rounded-full mt-1">
                      <div
                        className="h-full bg-primary/40 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Wrap-up time chip */}
                  <div className="flex flex-col items-end shrink-0 bg-muted/40 rounded-md px-2.5 py-1.5">
                    <span className="text-[10px] text-muted-foreground/70 leading-tight">Last wrap-up</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      <span>~{formatTimeDisplay(stylist.lastEndTime)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
