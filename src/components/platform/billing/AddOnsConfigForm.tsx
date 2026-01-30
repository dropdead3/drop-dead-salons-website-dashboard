import { MapPin, Users, DollarSign, Plus, Minus } from 'lucide-react';
import { PlatformInput } from '@/components/platform/ui/PlatformInput';
import { PlatformLabel } from '@/components/platform/ui/PlatformLabel';
import { PlatformButton } from '@/components/platform/ui/PlatformButton';
import { formatCurrency } from '@/hooks/useBillingCalculations';
import type { CapacityMetrics } from '@/hooks/useOrganizationCapacity';

interface AddOnsConfigFormProps {
  // Per-location
  perLocationFee: number;
  onPerLocationFeeChange: (fee: number) => void;
  additionalLocationsPurchased: number;
  onAdditionalLocationsPurchasedChange: (count: number) => void;
  includedLocations: number | null;
  onIncludedLocationsChange: (count: number | null) => void;
  planMaxLocations: number;
  locationMetrics: CapacityMetrics;
  
  // Per-user
  perUserFee: number;
  onPerUserFeeChange: (fee: number) => void;
  additionalUsersPurchased: number;
  onAdditionalUsersPurchasedChange: (count: number) => void;
  includedUsers: number | null;
  onIncludedUsersChange: (count: number | null) => void;
  planMaxUsers: number;
  userMetrics: CapacityMetrics;
}

function QuantityAdjuster({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <PlatformButton
        variant="outline"
        size="sm"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="h-8 w-8 p-0"
      >
        <Minus className="h-4 w-4" />
      </PlatformButton>
      <div className="w-16 text-center">
        <span className="text-lg font-semibold text-white">{value}</span>
        <span className="text-xs text-slate-500 block">{label}</span>
      </div>
      <PlatformButton
        variant="outline"
        size="sm"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="h-8 w-8 p-0"
      >
        <Plus className="h-4 w-4" />
      </PlatformButton>
    </div>
  );
}

export function AddOnsConfigForm({
  perLocationFee,
  onPerLocationFeeChange,
  additionalLocationsPurchased,
  onAdditionalLocationsPurchasedChange,
  includedLocations,
  onIncludedLocationsChange,
  planMaxLocations,
  locationMetrics,
  perUserFee,
  onPerUserFeeChange,
  additionalUsersPurchased,
  onAdditionalUsersPurchasedChange,
  includedUsers,
  onIncludedUsersChange,
  planMaxUsers,
  userMetrics,
}: AddOnsConfigFormProps) {
  const locationCost = additionalLocationsPurchased * perLocationFee;
  const userCost = additionalUsersPurchased * perUserFee;
  const totalCost = locationCost + userCost;

  return (
    <div className="space-y-6">
      {/* Locations Add-On */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-violet-400" />
          <PlatformLabel className="text-sm font-medium">Location Add-Ons</PlatformLabel>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Included locations override */}
          <div className="space-y-2">
            <PlatformLabel className="text-xs text-slate-400">
              Base Included (plan default: {planMaxLocations === -1 ? 'Unlimited' : planMaxLocations})
            </PlatformLabel>
            <PlatformInput
              type="number"
              min="0"
              value={includedLocations ?? ''}
              onChange={(e) => onIncludedLocationsChange(e.target.value ? parseInt(e.target.value) : null)}
              placeholder={planMaxLocations === -1 ? 'Unlimited' : String(planMaxLocations)}
              className="max-w-32"
            />
          </div>

          {/* Per-location fee */}
          <div className="space-y-2">
            <PlatformLabel className="text-xs text-slate-400">Per-Location Fee</PlatformLabel>
            <div className="relative max-w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <PlatformInput
                type="number"
                min="0"
                step="0.01"
                value={perLocationFee}
                onChange={(e) => onPerLocationFeeChange(parseFloat(e.target.value) || 0)}
                className="pl-7"
              />
            </div>
          </div>
        </div>

        {/* Additional locations purchased */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div>
            <p className="text-sm text-white">Additional Locations</p>
            <p className="text-xs text-slate-500">
              Currently using {locationMetrics.used} of {locationMetrics.isUnlimited ? '∞' : locationMetrics.total}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <QuantityAdjuster
              value={additionalLocationsPurchased}
              onChange={onAdditionalLocationsPurchasedChange}
              label="purchased"
            />
            {locationCost > 0 && (
              <span className="text-sm text-emerald-400">
                +{formatCurrency(locationCost)}/mo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Users Add-On */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-400" />
          <PlatformLabel className="text-sm font-medium">User Seat Add-Ons</PlatformLabel>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Included users override */}
          <div className="space-y-2">
            <PlatformLabel className="text-xs text-slate-400">
              Base Included (plan default: {planMaxUsers === -1 ? 'Unlimited' : planMaxUsers})
            </PlatformLabel>
            <PlatformInput
              type="number"
              min="0"
              value={includedUsers ?? ''}
              onChange={(e) => onIncludedUsersChange(e.target.value ? parseInt(e.target.value) : null)}
              placeholder={planMaxUsers === -1 ? 'Unlimited' : String(planMaxUsers)}
              className="max-w-32"
            />
          </div>

          {/* Per-user fee */}
          <div className="space-y-2">
            <PlatformLabel className="text-xs text-slate-400">Per-User Fee</PlatformLabel>
            <div className="relative max-w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <PlatformInput
                type="number"
                min="0"
                step="0.01"
                value={perUserFee}
                onChange={(e) => onPerUserFeeChange(parseFloat(e.target.value) || 0)}
                className="pl-7"
              />
            </div>
          </div>
        </div>

        {/* Additional users purchased */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div>
            <p className="text-sm text-white">Additional User Seats</p>
            <p className="text-xs text-slate-500">
              Currently using {userMetrics.used} of {userMetrics.isUnlimited ? '∞' : userMetrics.total}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <QuantityAdjuster
              value={additionalUsersPurchased}
              onChange={onAdditionalUsersPurchasedChange}
              label="purchased"
            />
            {userCost > 0 && (
              <span className="text-sm text-emerald-400">
                +{formatCurrency(userCost)}/mo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Total Add-On Cost */}
      {totalCost > 0 && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-violet-400" />
            <span className="text-sm font-medium text-white">Total Add-On Fees</span>
          </div>
          <span className="text-lg font-bold text-white">
            {formatCurrency(totalCost)}/mo
          </span>
        </div>
      )}
    </div>
  );
}
