import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import {
  PlatformCard,
  PlatformCardContent,
  PlatformCardHeader,
  PlatformCardTitle,
} from '@/components/platform/ui/PlatformCard';
import { PlatformButton } from '@/components/platform/ui/PlatformButton';
import { Textarea } from '@/components/ui/textarea';
import { PlatformLabel } from '@/components/platform/ui/PlatformLabel';
import { BillingStatusCard } from './BillingStatusCard';
import { PlanSelector } from './PlanSelector';
import { CustomPricingForm } from './CustomPricingForm';
import { PromoConfigForm } from './PromoConfigForm';
import { ContractTermsForm } from './ContractTermsForm';
import { SetupFeesForm } from './SetupFeesForm';
import { InvoicePreview } from './InvoicePreview';
import {
  useOrganizationBilling,
  useSubscriptionPlans,
  useUpsertOrganizationBilling,
  type BillingCycle,
  type DiscountType,
  type BillingStatus,
} from '@/hooks/useOrganizationBilling';
import { useBillingCalculations } from '@/hooks/useBillingCalculations';

interface BillingConfigurationPanelProps {
  organizationId: string;
  billingStatus: BillingStatus;
  locationCount: number;
}

export function BillingConfigurationPanel({
  organizationId,
  billingStatus,
  locationCount,
}: BillingConfigurationPanelProps) {
  const { data: billing, isLoading: billingLoading } = useOrganizationBilling(organizationId);
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const upsertBilling = useUpsertOrganizationBilling();

  // Form state
  const [planId, setPlanId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [contractLengthMonths, setContractLengthMonths] = useState(12);
  const [contractStartDate, setContractStartDate] = useState<string | null>(null);
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [trialDays, setTrialDays] = useState(0);
  
  // Custom pricing
  const [customPriceEnabled, setCustomPriceEnabled] = useState(false);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [discountType, setDiscountType] = useState<DiscountType | null>(null);
  const [discountValue, setDiscountValue] = useState<number | null>(null);
  const [discountReason, setDiscountReason] = useState<string | null>(null);
  
  // Promo
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoMonths, setPromoMonths] = useState<number | null>(null);
  const [promoPrice, setPromoPrice] = useState<number | null>(null);
  
  // Fees
  const [setupFee, setSetupFee] = useState(0);
  const [setupFeePaid, setSetupFeePaid] = useState(false);
  const [perLocationFee, setPerLocationFee] = useState(0);
  
  // Notes
  const [notes, setNotes] = useState('');

  // Initialize from existing billing
  useEffect(() => {
    if (billing) {
      setPlanId(billing.plan_id);
      setBillingCycle(billing.billing_cycle);
      setContractLengthMonths(billing.contract_length_months);
      setContractStartDate(billing.contract_start_date);
      setAutoRenewal(billing.auto_renewal);
      setTrialDays(billing.trial_days);
      setCustomPriceEnabled(billing.custom_price !== null || billing.discount_type !== null);
      setCustomPrice(billing.custom_price);
      setDiscountType(billing.discount_type);
      setDiscountValue(billing.discount_value);
      setDiscountReason(billing.discount_reason);
      setPromoEnabled(billing.promo_months !== null && billing.promo_months > 0);
      setPromoMonths(billing.promo_months);
      setPromoPrice(billing.promo_price);
      setSetupFee(billing.setup_fee);
      setSetupFeePaid(billing.setup_fee_paid);
      setPerLocationFee(billing.per_location_fee);
      setNotes(billing.notes || '');
    }
  }, [billing]);

  // Get selected plan
  const selectedPlan = plans?.find(p => p.id === planId) || null;
  const basePrice = selectedPlan?.price_monthly || 0;

  // Calculate promo end date
  const getPromoEndsAt = () => {
    if (!promoEnabled || !promoMonths || !contractStartDate) return null;
    return addMonths(new Date(contractStartDate), promoMonths).toISOString();
  };

  // Calculate trial end date
  const getTrialEndsAt = () => {
    if (!trialDays || !contractStartDate) return null;
    const start = new Date(contractStartDate);
    start.setDate(start.getDate() + trialDays);
    return start.toISOString();
  };

  // Calculate contract end date
  const getContractEndDate = () => {
    if (!contractStartDate) return null;
    return format(addMonths(new Date(contractStartDate), contractLengthMonths), 'yyyy-MM-dd');
  };

  // Build billing object for calculations
  const billingForCalc = {
    id: billing?.id || '',
    organization_id: organizationId,
    plan_id: planId,
    billing_cycle: billingCycle,
    contract_length_months: contractLengthMonths,
    contract_start_date: contractStartDate,
    contract_end_date: getContractEndDate(),
    base_price: basePrice,
    custom_price: customPriceEnabled ? customPrice : null,
    discount_type: customPriceEnabled ? discountType : null,
    discount_value: customPriceEnabled ? discountValue : null,
    discount_reason: customPriceEnabled ? discountReason : null,
    promo_months: promoEnabled ? promoMonths : null,
    promo_price: promoEnabled ? promoPrice : null,
    promo_ends_at: getPromoEndsAt(),
    trial_days: trialDays,
    trial_ends_at: getTrialEndsAt(),
    billing_starts_at: contractStartDate,
    setup_fee: setupFee,
    setup_fee_paid: setupFeePaid,
    per_location_fee: perLocationFee,
    auto_renewal: autoRenewal,
    notes: notes || null,
    created_at: billing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const calculation = useBillingCalculations(billingForCalc, selectedPlan, locationCount);

  const handleSave = () => {
    upsertBilling.mutate({
      organization_id: organizationId,
      plan_id: planId,
      billing_cycle: billingCycle,
      contract_length_months: contractLengthMonths,
      contract_start_date: contractStartDate,
      contract_end_date: getContractEndDate(),
      base_price: basePrice,
      custom_price: customPriceEnabled ? customPrice : null,
      discount_type: customPriceEnabled ? discountType : null,
      discount_value: customPriceEnabled ? discountValue : null,
      discount_reason: customPriceEnabled ? discountReason : null,
      promo_months: promoEnabled ? promoMonths : null,
      promo_price: promoEnabled ? promoPrice : null,
      promo_ends_at: getPromoEndsAt(),
      trial_days: trialDays,
      trial_ends_at: getTrialEndsAt(),
      billing_starts_at: contractStartDate,
      setup_fee: setupFee,
      setup_fee_paid: setupFeePaid,
      per_location_fee: perLocationFee,
      auto_renewal: autoRenewal,
      notes: notes || null,
    });
  };

  if (billingLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <BillingStatusCard
        billingStatus={billingStatus}
        calculation={calculation}
        billingCycle={billingCycle}
        nextInvoiceDate={null}
        planName={selectedPlan?.name}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Selection */}
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle>Subscription Plan</PlatformCardTitle>
            </PlatformCardHeader>
            <PlatformCardContent>
              {plans && (
                <PlanSelector
                  plans={plans}
                  selectedPlanId={planId}
                  onSelect={setPlanId}
                />
              )}
            </PlatformCardContent>
          </PlatformCard>

          {/* Custom Pricing */}
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle>Custom Pricing</PlatformCardTitle>
            </PlatformCardHeader>
            <PlatformCardContent>
              <CustomPricingForm
                customPriceEnabled={customPriceEnabled}
                onCustomPriceEnabledChange={setCustomPriceEnabled}
                customPrice={customPrice}
                onCustomPriceChange={setCustomPrice}
                discountType={discountType}
                onDiscountTypeChange={setDiscountType}
                discountValue={discountValue}
                onDiscountValueChange={setDiscountValue}
                discountReason={discountReason}
                onDiscountReasonChange={setDiscountReason}
                basePrice={basePrice}
              />
            </PlatformCardContent>
          </PlatformCard>

          {/* Promotional Pricing */}
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle>Promotional Pricing</PlatformCardTitle>
            </PlatformCardHeader>
            <PlatformCardContent>
              <PromoConfigForm
                promoEnabled={promoEnabled}
                onPromoEnabledChange={setPromoEnabled}
                promoMonths={promoMonths}
                onPromoMonthsChange={setPromoMonths}
                promoPrice={promoPrice}
                onPromoPriceChange={setPromoPrice}
                basePrice={customPriceEnabled && customPrice ? customPrice : basePrice}
              />
            </PlatformCardContent>
          </PlatformCard>

          {/* Contract Terms */}
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle>Contract Terms</PlatformCardTitle>
            </PlatformCardHeader>
            <PlatformCardContent>
              <ContractTermsForm
                billingCycle={billingCycle}
                onBillingCycleChange={setBillingCycle}
                contractLengthMonths={contractLengthMonths}
                onContractLengthChange={setContractLengthMonths}
                contractStartDate={contractStartDate}
                onContractStartDateChange={setContractStartDate}
                autoRenewal={autoRenewal}
                onAutoRenewalChange={setAutoRenewal}
                trialDays={trialDays}
                onTrialDaysChange={setTrialDays}
              />
            </PlatformCardContent>
          </PlatformCard>

          {/* Setup Fees */}
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle>Fees & Add-ons</PlatformCardTitle>
            </PlatformCardHeader>
            <PlatformCardContent>
              <SetupFeesForm
                setupFee={setupFee}
                onSetupFeeChange={setSetupFee}
                setupFeePaid={setupFeePaid}
                onSetupFeePaidChange={setSetupFeePaid}
                perLocationFee={perLocationFee}
                onPerLocationFeeChange={setPerLocationFee}
                locationCount={locationCount}
              />
            </PlatformCardContent>
          </PlatformCard>

          {/* Notes */}
          <PlatformCard variant="glass">
            <PlatformCardHeader>
              <PlatformCardTitle>Internal Notes</PlatformCardTitle>
            </PlatformCardHeader>
            <PlatformCardContent>
              <div className="space-y-2">
                <PlatformLabel htmlFor="billingNotes">Billing Notes</PlatformLabel>
                <Textarea
                  id="billingNotes"
                  placeholder="Internal notes about billing arrangements, negotiations, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-slate-300 min-h-[100px]"
                />
              </div>
            </PlatformCardContent>
          </PlatformCard>
        </div>

        {/* Sidebar - Invoice Preview */}
        <div className="space-y-6">
          <InvoicePreview
            calculation={calculation}
            billingCycle={billingCycle}
            planName={selectedPlan?.name || 'No Plan Selected'}
            setupFee={setupFee}
            setupFeePaid={setupFeePaid}
            locationCount={locationCount}
            perLocationFee={perLocationFee}
          />

          <PlatformButton
            className="w-full"
            onClick={handleSave}
            disabled={upsertBilling.isPending || !planId}
          >
            {upsertBilling.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Billing Configuration
          </PlatformButton>
        </div>
      </div>
    </div>
  );
}
