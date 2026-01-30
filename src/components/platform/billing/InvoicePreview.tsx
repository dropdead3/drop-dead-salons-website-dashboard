import { Receipt, ArrowRight } from 'lucide-react';
import {
  PlatformCard,
  PlatformCardContent,
  PlatformCardHeader,
  PlatformCardTitle,
} from '@/components/platform/ui/PlatformCard';
import type { BillingCalculation } from '@/hooks/useBillingCalculations';
import { formatCurrency, getBillingCycleLabel } from '@/hooks/useBillingCalculations';
import type { BillingCycle } from '@/hooks/useOrganizationBilling';

interface InvoicePreviewProps {
  calculation: BillingCalculation;
  billingCycle: BillingCycle;
  planName: string;
  setupFee: number;
  setupFeePaid: boolean;
  locationCount: number;
  perLocationFee: number;
}

export function InvoicePreview({
  calculation,
  billingCycle,
  planName,
  setupFee,
  setupFeePaid,
  locationCount,
  perLocationFee,
}: InvoicePreviewProps) {
  const additionalLocations = Math.max(0, locationCount - 1);
  const hasLocationFees = additionalLocations > 0 && perLocationFee > 0;

  return (
    <PlatformCard variant="glass">
      <PlatformCardHeader className="pb-3">
        <PlatformCardTitle className="text-lg flex items-center gap-2">
          <Receipt className="h-5 w-5 text-violet-400" />
          Invoice Preview
        </PlatformCardTitle>
      </PlatformCardHeader>
      <PlatformCardContent className="space-y-4">
        {/* First Invoice */}
        <div className="space-y-3">
          <p className="text-xs text-slate-400 uppercase tracking-wider">First Invoice</p>
          
          {calculation.isInTrial ? (
            <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/30">
              <p className="text-sm text-violet-300">
                No payment due during {calculation.daysUntilTrialEnds}-day trial
              </p>
              <p className="text-xs text-violet-400/70 mt-1">
                First invoice will be generated when trial ends
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Base Plan */}
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{planName} ({getBillingCycleLabel(billingCycle)})</span>
                <span className="text-white">{formatCurrency(calculation.cycleAmount)}</span>
              </div>

              {/* Location Fees */}
              {hasLocationFees && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Additional Locations ({additionalLocations} × {formatCurrency(perLocationFee)})
                  </span>
                  <span className="text-white">{formatCurrency(additionalLocations * perLocationFee)}</span>
                </div>
              )}

              {/* Setup Fee */}
              {setupFee > 0 && !setupFeePaid && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Setup Fee (one-time)</span>
                  <span className="text-white">{formatCurrency(setupFee)}</span>
                </div>
              )}

              {/* Promo Discount */}
              {calculation.isInPromo && calculation.promoSavings > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>Promotional Discount</span>
                  <span>-{formatCurrency(calculation.promoSavings)}</span>
                </div>
              )}

              {/* Cycle Savings */}
              {calculation.savingsAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>{getBillingCycleLabel(billingCycle)} Savings ({calculation.savingsPercentage}%)</span>
                  <span>-{formatCurrency(calculation.savingsAmount)}</span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between pt-2 border-t border-slate-700">
                <span className="font-medium text-white">Total Due</span>
                <span className="font-bold text-lg text-white">
                  {formatCurrency(calculation.firstInvoiceAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Ongoing */}
        <div className="space-y-3 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Ongoing</p>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="flex-1 p-3 rounded-lg bg-slate-800/50 text-center">
              <p className="text-slate-500 text-xs mb-1">Per Cycle</p>
              <p className="font-semibold text-white">{formatCurrency(calculation.cycleAmount)}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600" />
            <div className="flex-1 p-3 rounded-lg bg-slate-800/50 text-center">
              <p className="text-slate-500 text-xs mb-1">Annual Total</p>
              <p className="font-semibold text-white">{formatCurrency(calculation.annualAmount)}</p>
            </div>
          </div>

          {calculation.isInPromo && (
            <p className="text-xs text-slate-500">
              * After promotional period, rate increases to {formatCurrency(calculation.monthlyAmount)}/mo
            </p>
          )}
        </div>
      </PlatformCardContent>
    </PlatformCard>
  );
}
