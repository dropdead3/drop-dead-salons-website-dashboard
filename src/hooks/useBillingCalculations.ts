import { useMemo } from 'react';
import type { OrganizationBilling, BillingCycle, SubscriptionPlan } from './useOrganizationBilling';

export interface BillingCalculation {
  monthlyAmount: number;
  effectiveMonthlyAmount: number;
  cycleAmount: number;
  annualAmount: number;
  firstInvoiceAmount: number;
  savingsAmount: number;
  savingsPercentage: number;
  isInPromo: boolean;
  promoSavings: number;
  daysUntilPromoEnds: number | null;
  daysUntilTrialEnds: number | null;
  isInTrial: boolean;
}

const CYCLE_MULTIPLIERS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  semi_annual: 6,
  annual: 12,
};

const CYCLE_DISCOUNTS: Record<BillingCycle, number> = {
  monthly: 0,
  quarterly: 0.05,     // 5% discount
  semi_annual: 0.10,   // 10% discount
  annual: 0.20,        // 20% discount
};

export function calculateDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const targetDate = new Date(dateStr);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isDateInFuture(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) > new Date();
}

export function useBillingCalculations(
  billing: OrganizationBilling | null,
  plan: SubscriptionPlan | null,
  locationCount: number = 1
): BillingCalculation {
  return useMemo(() => {
    // Default values when no billing config
    if (!billing || !plan) {
      return {
        monthlyAmount: plan?.price_monthly || 0,
        effectiveMonthlyAmount: plan?.price_monthly || 0,
        cycleAmount: plan?.price_monthly || 0,
        annualAmount: (plan?.price_monthly || 0) * 12,
        firstInvoiceAmount: plan?.price_monthly || 0,
        savingsAmount: 0,
        savingsPercentage: 0,
        isInPromo: false,
        promoSavings: 0,
        daysUntilPromoEnds: null,
        daysUntilTrialEnds: null,
        isInTrial: false,
      };
    }

    const cycle = billing.billing_cycle;
    const cycleMultiplier = CYCLE_MULTIPLIERS[cycle];
    const cycleDiscount = CYCLE_DISCOUNTS[cycle];

    // Determine base monthly price
    let baseMonthly = billing.custom_price ?? billing.base_price ?? plan.price_monthly;

    // Check if in promo period
    const isInPromo = isDateInFuture(billing.promo_ends_at);
    const daysUntilPromoEnds = calculateDaysUntil(billing.promo_ends_at);
    
    // Check if in trial
    const isInTrial = isDateInFuture(billing.trial_ends_at);
    const daysUntilTrialEnds = calculateDaysUntil(billing.trial_ends_at);

    // Apply promo pricing if active
    let effectiveMonthly = baseMonthly;
    let promoSavings = 0;
    if (isInPromo && billing.promo_price !== null) {
      promoSavings = baseMonthly - billing.promo_price;
      effectiveMonthly = billing.promo_price;
    }

    // Apply discount if set (and not in promo)
    if (!isInPromo && billing.discount_type && billing.discount_value) {
      if (billing.discount_type === 'percentage') {
        effectiveMonthly = effectiveMonthly * (1 - billing.discount_value / 100);
      } else if (billing.discount_type === 'fixed_amount') {
        effectiveMonthly = Math.max(0, effectiveMonthly - billing.discount_value);
      }
    }

    // Add per-location fees (first location included in base)
    const additionalLocations = Math.max(0, locationCount - 1);
    const locationFees = additionalLocations * (billing.per_location_fee || 0);
    effectiveMonthly += locationFees;

    // Calculate cycle amount with discount
    const cycleAmountBeforeDiscount = effectiveMonthly * cycleMultiplier;
    const cycleAmount = cycleAmountBeforeDiscount * (1 - cycleDiscount);

    // Calculate savings from billing cycle
    const fullPrice = effectiveMonthly * cycleMultiplier;
    const savingsAmount = fullPrice - cycleAmount;
    const savingsPercentage = cycleDiscount * 100;

    // Annual projection
    const annualAmount = (cycleAmount / cycleMultiplier) * 12;

    // First invoice calculation
    let firstInvoiceAmount = cycleAmount;
    if (!billing.setup_fee_paid && billing.setup_fee > 0) {
      firstInvoiceAmount += billing.setup_fee;
    }

    // If in trial, first invoice is 0 until trial ends
    if (isInTrial) {
      firstInvoiceAmount = 0;
    }

    return {
      monthlyAmount: baseMonthly,
      effectiveMonthlyAmount: effectiveMonthly,
      cycleAmount,
      annualAmount,
      firstInvoiceAmount,
      savingsAmount,
      savingsPercentage,
      isInPromo,
      promoSavings,
      daysUntilPromoEnds,
      daysUntilTrialEnds,
      isInTrial,
    };
  }, [billing, plan, locationCount]);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getBillingCycleLabel(cycle: BillingCycle): string {
  const labels: Record<BillingCycle, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semi_annual: 'Semi-Annual',
    annual: 'Annual',
  };
  return labels[cycle];
}

export function getContractLengthLabel(months: number): string {
  if (months === 1) return 'Month-to-Month';
  if (months === 6) return '6 Months';
  if (months === 12) return '1 Year';
  if (months === 24) return '2 Years';
  if (months === 36) return '3 Years';
  return `${months} Months`;
}
