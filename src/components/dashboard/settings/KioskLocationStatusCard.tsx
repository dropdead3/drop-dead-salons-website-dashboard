import { UserCheck, ClipboardCheck, CalendarPlus, FileSignature, Upload, Loader2, Tablet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useLocations } from '@/hooks/useLocations';
import { useAllOrgKioskSettings, usePushDefaultsToAllLocations, useKioskDeviceStatus, KioskSettings, KioskDeviceStatus } from '@/hooks/useKioskSettings';
import { OnlineIndicator } from '@/components/platform/ui/OnlineIndicator';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface KioskLocationStatusCardProps {
  orgId: string;
  onLocationSelect: (locationId: string | null) => void;
}

type LocationStatus = 'Customized' | 'Using Defaults' | 'Not Configured';

interface LocationRow {
  locationId: string;
  locationName: string;
  status: LocationStatus;
  enableWalkIns: boolean | null;
  enableSelfBooking: boolean | null;
  requireFormSigning: boolean | null;
}

function FeatureDot({ enabled }: { enabled: boolean | null }) {
  if (enabled === null) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full',
        enabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'
      )}
    />
  );
}

function StatusBadge({ status }: { status: LocationStatus }) {
  const variants: Record<LocationStatus, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
    'Customized': { variant: 'default', label: 'Customized' },
    'Using Defaults': { variant: 'secondary', label: 'Defaults' },
    'Not Configured': { variant: 'outline', label: 'No Config' },
  };
  const { variant, label } = variants[status];
  return <Badge variant={variant} className="text-[10px] px-2 py-0.5">{label}</Badge>;
}

function DeviceStatusCell({ status }: { status?: KioskDeviceStatus }) {
  if (!status) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const label = status.isOnline ? 'Online' : 'Offline';
  const lastSeenText = status.lastSeen
    ? formatDistanceToNow(status.lastSeen, { addSuffix: true })
    : 'Never';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1.5">
            <OnlineIndicator isOnline={status.isOnline} size="sm" />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">{status.deviceName || 'Unknown Device'}</p>
          <p className="text-muted-foreground">Last seen: {lastSeenText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function KioskLocationStatusCard({ orgId, onLocationSelect }: KioskLocationStatusCardProps) {
  const { data: locations = [] } = useLocations();
  const { data: allSettings = [], isLoading } = useAllOrgKioskSettings(orgId);
  const { data: deviceStatusMap = new Map() } = useKioskDeviceStatus(orgId);
  const pushToAll = usePushDefaultsToAllLocations();

  // Only active locations
  const activeLocations = locations.filter(l => l.is_active);

  // Find org default row (location_id is null)
  const orgDefault = allSettings.find(s => !s.location_id);

  // Build rows
  const rows: LocationRow[] = activeLocations.map(loc => {
    const locSettings = allSettings.find(s => s.location_id === loc.id);

    if (locSettings) {
      return {
        locationId: loc.id,
        locationName: loc.name,
        status: 'Customized',
        enableWalkIns: locSettings.enable_walk_ins,
        enableSelfBooking: locSettings.enable_self_booking,
        requireFormSigning: locSettings.require_form_signing,
      };
    }

    if (orgDefault) {
      return {
        locationId: loc.id,
        locationName: loc.name,
        status: 'Using Defaults',
        enableWalkIns: orgDefault.enable_walk_ins,
        enableSelfBooking: orgDefault.enable_self_booking,
        requireFormSigning: orgDefault.require_form_signing,
      };
    }

    return {
      locationId: loc.id,
      locationName: loc.name,
      status: 'Not Configured',
      enableWalkIns: null,
      enableSelfBooking: null,
      requireFormSigning: null,
    };
  });

  const hasOverrides = allSettings.some(s => s.location_id !== null);

  if (activeLocations.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-lg">KIOSK STATUS BY LOCATION</CardTitle>
            <CardDescription>
              Overview of kiosk configuration across all locations
            </CardDescription>
          </div>
          {hasOverrides && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={pushToAll.isPending}>
                  {pushToAll.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Apply Defaults to All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apply Defaults to All Locations?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all location-specific customizations. All locations will inherit from the organization defaults.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => pushToAll.mutate(orgId)}>
                    Yes, Apply to All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead className="text-center w-24">
                  <div className="flex flex-col items-center gap-0.5">
                    <Tablet className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Device</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-20">
                  <div className="flex flex-col items-center gap-0.5">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Check-In</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-20">
                  <div className="flex flex-col items-center gap-0.5">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Walk-In</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-20">
                  <div className="flex flex-col items-center gap-0.5">
                    <CalendarPlus className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Booking</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-20">
                  <div className="flex flex-col items-center gap-0.5">
                    <FileSignature className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Forms</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow
                  key={row.locationId}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => onLocationSelect(row.locationId)}
                >
                  <TableCell className="font-medium">{row.locationName}</TableCell>
                  <TableCell className="text-center">
                    <DeviceStatusCell status={deviceStatusMap instanceof Map ? deviceStatusMap.get(row.locationId) : undefined} />
                  </TableCell>
                  <TableCell className="text-center">
                    <FeatureDot enabled={row.status === 'Not Configured' ? null : true} />
                  </TableCell>
                  <TableCell className="text-center">
                    <FeatureDot enabled={row.enableWalkIns} />
                  </TableCell>
                  <TableCell className="text-center">
                    <FeatureDot enabled={row.enableSelfBooking} />
                  </TableCell>
                  <TableCell className="text-center">
                    <FeatureDot enabled={row.requireFormSigning} />
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
