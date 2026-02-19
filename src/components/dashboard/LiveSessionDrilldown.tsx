import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, MapPin } from 'lucide-react';
import { DRILLDOWN_DIALOG_CONTENT_CLASS, DRILLDOWN_OVERLAY_CLASS } from './drilldownDialogStyles';
import { tokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { LocationSelect } from '@/components/ui/location-select';
import { useLiveSessionSnapshot } from '@/hooks/useLiveSessionSnapshot';
import { isAllLocations } from '@/lib/locationFilter';
import type { StylistDetail } from '@/hooks/useLiveSessionSnapshot';

// Demo data — split across two locations
const DEMO_DETAILS: StylistDetail[] = [
  { name: 'Sarah M.', photoUrl: null, currentService: 'Balayage & Tone', currentEndTime: '14:30:00', lastEndTime: '17:00:00', currentApptIndex: 3, totalAppts: 5, assistedBy: ['Jamie R.'], clientName: 'Jessica Smith', locationId: 'loc-1', locationName: 'North Mesa' },
  { name: 'Jasmine T.', photoUrl: null, currentService: 'Haircut & Style', currentEndTime: '13:45:00', lastEndTime: '17:30:00', currentApptIndex: 2, totalAppts: 6, assistedBy: [], clientName: 'Amanda Torres', locationId: 'loc-1', locationName: 'North Mesa' },
  { name: 'Kira L.', photoUrl: null, currentService: 'Root Touch-Up', currentEndTime: '14:00:00', lastEndTime: '18:00:00', currentApptIndex: 4, totalAppts: 7, assistedBy: [], clientName: 'Rachel Green', locationId: 'loc-2', locationName: 'Val Vista Lakes' },
  { name: 'Morgan W.', photoUrl: null, currentService: 'Extensions Install', currentEndTime: '15:00:00', lastEndTime: '18:00:00', currentApptIndex: 1, totalAppts: 3, assistedBy: ['Taylor K.', 'Jamie R.'], clientName: 'Sophia Chen', locationId: 'loc-2', locationName: 'Val Vista Lakes' },
  { name: 'Alexa P.', photoUrl: null, currentService: 'Blowout', currentEndTime: '13:30:00', lastEndTime: '18:30:00', currentApptIndex: 5, totalAppts: 8, assistedBy: [], clientName: 'Emily Davis', locationId: 'loc-1', locationName: 'North Mesa' },
  { name: 'Bianca R.', photoUrl: null, currentService: 'Highlights', currentEndTime: '14:15:00', lastEndTime: '18:30:00', currentApptIndex: 2, totalAppts: 5, assistedBy: [], clientName: 'Olivia Martinez', locationId: 'loc-1', locationName: 'North Mesa' },
  { name: 'Dani C.', photoUrl: null, currentService: 'Brazilian Blowout', currentEndTime: '14:45:00', lastEndTime: '19:00:00', currentApptIndex: 3, totalAppts: 6, assistedBy: ['Jamie R.'], clientName: 'Mia Johnson', locationId: 'loc-2', locationName: 'Val Vista Lakes' },
  { name: 'Elena F.', photoUrl: null, currentService: 'Color Correction', currentEndTime: '15:30:00', lastEndTime: '19:00:00', currentApptIndex: 4, totalAppts: 7, assistedBy: [], clientName: 'Isabella Wright', locationId: 'loc-2', locationName: 'Val Vista Lakes' },
  { name: 'Gina H.', photoUrl: null, currentService: 'Keratin Treatment', currentEndTime: '14:00:00', lastEndTime: '19:30:00', currentApptIndex: 2, totalAppts: 4, assistedBy: [], clientName: 'Charlotte Lee', locationId: 'loc-1', locationName: 'North Mesa' },
  { name: 'Haven J.', photoUrl: null, currentService: 'Men\'s Cut', currentEndTime: '13:15:00', lastEndTime: '19:30:00', currentApptIndex: 6, totalAppts: 9, assistedBy: [], clientName: 'James Wilson', locationId: 'loc-1', locationName: 'North Mesa' },
  { name: 'Ivy K.', photoUrl: null, currentService: 'Updo', currentEndTime: '14:30:00', lastEndTime: '20:00:00', currentApptIndex: 3, totalAppts: 5, assistedBy: ['Taylor K.'], clientName: 'Ava Thompson', locationId: 'loc-2', locationName: 'Val Vista Lakes' },
  { name: 'Jade N.', photoUrl: null, currentService: 'Gloss Treatment', currentEndTime: '13:45:00', lastEndTime: '20:00:00', currentApptIndex: 1, totalAppts: 4, assistedBy: [], clientName: 'Harper Brown', locationId: 'loc-2', locationName: 'Val Vista Lakes' },
  { name: 'Luna Q.', photoUrl: null, currentService: 'Full Color', currentEndTime: '14:00:00', lastEndTime: '20:30:00', currentApptIndex: 2, totalAppts: 6, assistedBy: [], clientName: 'Lily Anderson', locationId: 'loc-1', locationName: 'North Mesa' },
];

const DEMO_MODE = true;

function formatTimeDisplay(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function getInitials(name: string) {
  const clean = name.replace(/\.$/, '').trim();
  const parts = clean.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (clean[0] || '?').toUpperCase();
}

/** Ensures single-letter last names end with a period (e.g., "Sarah M" → "Sarah M.") */
function formatNameWithPeriod(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    if (last.length === 1) {
      parts[parts.length - 1] = last + '.';
    }
  }
  return parts.join(' ');
}

interface LiveSessionDrilldownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inSessionCount: number;
  activeStylistCount: number;
  stylistDetails: StylistDetail[];
  locationId?: string;
}

export function LiveSessionDrilldown({
  open,
  onOpenChange,
  inSessionCount,
  activeStylistCount,
  stylistDetails,
  locationId,
}: LiveSessionDrilldownProps) {
  const [drilldownLocationId, setDrilldownLocationId] = useState(locationId || 'all');

  // Sync with parent filter when dialog opens
  useEffect(() => {
    if (open) setDrilldownLocationId(locationId || 'all');
  }, [open, locationId]);

  const live = useLiveSessionSnapshot(drilldownLocationId);

  const details = DEMO_MODE ? DEMO_DETAILS : live.stylistDetails;
  const sessionCount = DEMO_MODE ? 18 : live.inSessionCount;
  const stylistCount = DEMO_MODE ? DEMO_DETAILS.length : live.activeStylistCount;
  const showGrouped = isAllLocations(drilldownLocationId);

  // Group stylists by location when showing all locations
  const groupedDetails = useMemo(() => {
    if (!showGrouped) return null;
    const groups = new Map<string, StylistDetail[]>();
    for (const s of details) {
      const key = s.locationName || 'Unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [details, showGrouped]);

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

        {/* Location filter */}
        <div className="px-5 pb-3">
          <LocationSelect
            value={drilldownLocationId}
            onValueChange={setDrilldownLocationId}
            includeAll
            allLabel="All Locations"
            triggerClassName="h-8 text-xs"
          />
        </div>

        {/* Gradient divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Stylist list */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="py-1">
            {showGrouped && groupedDetails ? (
              groupedDetails.map(([locationName, stylists]) => (
                <div key={locationName}>
                  {/* Location section header */}
                  <div className="sticky top-0 z-10 flex items-center gap-2 px-5 py-2 bg-muted/60 backdrop-blur-sm border-b border-border/50">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{locationName}</span>
                    <span className="text-[10px] text-muted-foreground">· {stylists.length} stylist{stylists.length !== 1 ? 's' : ''}</span>
                  </div>
                  {stylists.map((stylist, i) => (
                    <StylistRow key={i} stylist={stylist} />
                  ))}
                </div>
              ))
            ) : (
              details.map((stylist, i) => (
                <StylistRow key={i} stylist={stylist} />
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Single stylist row — extracted to avoid duplication between grouped/flat modes */
function StylistRow({ stylist }: { stylist: StylistDetail }) {
  const progress = stylist.totalAppts > 0
    ? (stylist.currentApptIndex / stylist.totalAppts) * 100
    : 0;

  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-muted/30 transition-colors">
      <Avatar className="h-9 w-9 shrink-0 border border-border">
        {stylist.photoUrl ? (
          <AvatarImage src={stylist.photoUrl} alt={stylist.name} />
        ) : null}
        <AvatarFallback className="text-[10px] bg-muted text-muted-foreground rounded-lg">
          {getInitials(stylist.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">{formatNameWithPeriod(stylist.name)}</p>
          {stylist.assistedBy.length > 0 && (
            <span className="bg-muted/60 text-muted-foreground/80 text-[10px] px-2 py-0.5 rounded-full italic whitespace-nowrap">
              Assisted by {stylist.assistedBy.map(formatNameWithPeriod).join(', ')}
            </span>
          )}
        </div>
        {stylist.currentService && (
          <p className="text-xs text-muted-foreground truncate">
            {stylist.currentService}{stylist.clientName ? ` on ${stylist.clientName}` : ''}
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
}
