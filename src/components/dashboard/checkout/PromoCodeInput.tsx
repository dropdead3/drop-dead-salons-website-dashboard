import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useValidatePromoCode, PromoValidationResult } from '@/hooks/usePromoCodeValidation';
import { toast } from 'sonner';

interface PromoCodeInputProps {
  organizationId: string;
  subtotal: number;
  clientId?: string;
  serviceIds?: string[];
  categories?: string[];
  onPromoApplied: (result: PromoValidationResult | null) => void;
  appliedPromo: PromoValidationResult | null;
}

export function PromoCodeInput({
  organizationId,
  subtotal,
  clientId,
  serviceIds = [],
  categories = [],
  onPromoApplied,
  appliedPromo,
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const validatePromo = useValidatePromoCode();

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    try {
      const result = await validatePromo.mutateAsync({
        organizationId,
        promoCode: promoCode.trim(),
        clientId,
        subtotal,
        serviceIds,
        categories,
      });

      if (result.valid) {
        onPromoApplied(result);
        toast.success(`Promo code applied! Save $${result.calculated_discount?.toFixed(2)}`);
      } else {
        toast.error(result.error || 'Invalid promo code');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to validate promo code');
    }
  };

  const handleRemovePromo = () => {
    onPromoApplied(null);
    setPromoCode('');
  };

  if (appliedPromo) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              {appliedPromo.promotion?.name}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {appliedPromo.promotion?.promotion_type === 'percentage_discount' 
                ? `${appliedPromo.promotion?.discount_value}% off`
                : `$${appliedPromo.promotion?.discount_value?.toFixed(2)} off`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
            -${appliedPromo.calculated_discount?.toFixed(2)}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-600 hover:text-red-600 hover:bg-red-100"
            onClick={handleRemovePromo}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
            className="pl-9"
            disabled={validatePromo.isPending}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleApplyPromo}
          disabled={validatePromo.isPending || !promoCode.trim()}
        >
          {validatePromo.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
      {validatePromo.isError && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          <span>{(validatePromo.error as any)?.message || 'Invalid promo code'}</span>
        </div>
      )}
    </div>
  );
}
