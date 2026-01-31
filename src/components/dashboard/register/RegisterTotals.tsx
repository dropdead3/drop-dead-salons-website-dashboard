import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calculator } from 'lucide-react';

interface RegisterTotalsProps {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  appliedCredit: number;
  total: number;
}

export function RegisterTotals({ subtotal, taxAmount, taxRate, appliedCredit, total }: RegisterTotalsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax ({(taxRate * 100).toFixed(1)}%)</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>

        {appliedCredit > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Credit Applied</span>
            <span>-${appliedCredit.toFixed(2)}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
