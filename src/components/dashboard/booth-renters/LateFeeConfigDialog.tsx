import { useEffect } from 'react';
import { useLateFeeConfig, useCreateOrUpdateLateFeeConfig, LateFeeConfig } from '@/hooks/useLateFeeConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm, Controller } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

interface LateFeeConfigDialogProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  grace_period_days: number;
  late_fee_type: 'flat' | 'percentage' | 'daily';
  late_fee_amount: number;
  late_fee_percentage: number;
  daily_fee_amount: number;
  max_late_fee: number;
  auto_apply: boolean;
}

export function LateFeeConfigDialog({ organizationId, open, onOpenChange }: LateFeeConfigDialogProps) {
  const { data: config, isLoading } = useLateFeeConfig(organizationId);
  const saveConfig = useCreateOrUpdateLateFeeConfig();

  const { register, handleSubmit, control, watch, reset, setValue } = useForm<FormData>({
    defaultValues: {
      grace_period_days: 5,
      late_fee_type: 'flat',
      late_fee_amount: 25,
      late_fee_percentage: 0.05,
      daily_fee_amount: 5,
      max_late_fee: 100,
      auto_apply: true,
    },
  });

  const feeType = watch('late_fee_type');

  useEffect(() => {
    if (config) {
      reset({
        grace_period_days: config.grace_period_days,
        late_fee_type: config.late_fee_type,
        late_fee_amount: config.late_fee_amount || 25,
        late_fee_percentage: (config.late_fee_percentage || 0.05) * 100, // Convert to percentage for display
        daily_fee_amount: config.daily_fee_amount || 5,
        max_late_fee: config.max_late_fee || 100,
        auto_apply: config.auto_apply,
      });
    }
  }, [config, reset]);

  const onSubmit = async (data: FormData) => {
    await saveConfig.mutateAsync({
      organizationId,
      grace_period_days: data.grace_period_days,
      late_fee_type: data.late_fee_type,
      late_fee_amount: data.late_fee_type === 'flat' ? data.late_fee_amount : null,
      late_fee_percentage: data.late_fee_type === 'percentage' ? data.late_fee_percentage / 100 : null,
      daily_fee_amount: data.late_fee_type === 'daily' ? data.daily_fee_amount : null,
      max_late_fee: data.max_late_fee || null,
      auto_apply: data.auto_apply,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Late Fee Configuration</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Grace Period (Days)</Label>
              <Input
                type="number"
                {...register('grace_period_days', { valueAsNumber: true, min: 0 })}
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground">
                Late fees are applied after this many days past the due date
              </p>
            </div>

            <div className="space-y-2">
              <Label>Fee Type</Label>
              <Controller
                name="late_fee_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Fee</SelectItem>
                      <SelectItem value="percentage">Percentage of Rent</SelectItem>
                      <SelectItem value="daily">Daily Accruing</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {feeType === 'flat' && (
              <div className="space-y-2">
                <Label>Late Fee Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    className="pl-7"
                    {...register('late_fee_amount', { valueAsNumber: true, min: 0 })}
                    placeholder="25.00"
                  />
                </div>
              </div>
            )}

            {feeType === 'percentage' && (
              <div className="space-y-2">
                <Label>Late Fee Percentage</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    className="pr-7"
                    {...register('late_fee_percentage', { valueAsNumber: true, min: 0, max: 100 })}
                    placeholder="5"
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage of the rent amount
                </p>
              </div>
            )}

            {feeType === 'daily' && (
              <div className="space-y-2">
                <Label>Daily Fee Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    className="pl-7"
                    {...register('daily_fee_amount', { valueAsNumber: true, min: 0 })}
                    placeholder="5.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Charged per day after grace period
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Maximum Late Fee</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  className="pl-7"
                  {...register('max_late_fee', { valueAsNumber: true, min: 0 })}
                  placeholder="100.00"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Cap on total late fees (leave empty for no cap)
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Auto-Apply Late Fees</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically add late fees after grace period
                </p>
              </div>
              <Controller
                name="auto_apply"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <p className="text-xs">
                Late fees are processed daily at 6:00 AM UTC. Renters will be notified via email when fees are applied.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveConfig.isPending}>
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
