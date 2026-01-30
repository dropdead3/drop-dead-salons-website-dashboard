import { Switch } from '@/components/ui/switch';
import { PlatformInput } from '@/components/platform/ui/PlatformInput';
import { PlatformLabel } from '@/components/platform/ui/PlatformLabel';
import { DollarSign, MapPin } from 'lucide-react';
import { formatCurrency } from '@/hooks/useBillingCalculations';

interface SetupFeesFormProps {
  setupFee: number;
  onSetupFeeChange: (fee: number) => void;
  setupFeePaid: boolean;
  onSetupFeePaidChange: (paid: boolean) => void;
  perLocationFee: number;
  onPerLocationFeeChange: (fee: number) => void;
  locationCount: number;
}

export function SetupFeesForm({
  setupFee,
  onSetupFeeChange,
  setupFeePaid,
  onSetupFeePaidChange,
  perLocationFee,
  onPerLocationFeeChange,
  locationCount,
}: SetupFeesFormProps) {
  const additionalLocations = Math.max(0, locationCount - 1);

  return (
    <div className="space-y-4">
      {/* Setup Fee */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-violet-400" />
          <PlatformLabel className="text-sm font-medium">Setup / Migration Fee</PlatformLabel>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <PlatformLabel htmlFor="setupFee" className="text-xs text-slate-400">Amount</PlatformLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <PlatformInput
                id="setupFee"
                type="number"
                min="0"
                step="0.01"
                value={setupFee}
                onChange={(e) => onSetupFeeChange(parseFloat(e.target.value) || 0)}
                className="pl-7"
              />
            </div>
          </div>

          <div className="flex items-end">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 w-full">
              <Switch
                checked={setupFeePaid}
                onCheckedChange={onSetupFeePaidChange}
              />
              <span className="text-sm text-slate-300">
                {setupFeePaid ? 'Already Paid' : 'Not Paid'}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          One-time fee for onboarding, data migration, or setup services
        </p>
      </div>

      {/* Per Location Fee */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-violet-400" />
          <PlatformLabel className="text-sm font-medium">Per-Location Fee</PlatformLabel>
        </div>
        
        <div className="space-y-2">
          <PlatformLabel htmlFor="perLocationFee" className="text-xs text-slate-400">
            Additional monthly fee per location (first location included)
          </PlatformLabel>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <PlatformInput
              id="perLocationFee"
              type="number"
              min="0"
              step="0.01"
              value={perLocationFee}
              onChange={(e) => onPerLocationFeeChange(parseFloat(e.target.value) || 0)}
              className="pl-7"
            />
          </div>
        </div>

        {additionalLocations > 0 && perLocationFee > 0 && (
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <p className="text-sm text-slate-300">
              {locationCount} locations total → {formatCurrency(perLocationFee * additionalLocations)}/mo in location fees
            </p>
            <p className="text-xs text-slate-500 mt-1">
              (1 included + {additionalLocations} additional × {formatCurrency(perLocationFee)})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
