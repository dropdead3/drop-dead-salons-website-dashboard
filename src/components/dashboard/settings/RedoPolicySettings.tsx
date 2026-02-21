import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Loader2, RotateCcw, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { tokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import {
  useRedoPolicySettings,
  useUpdateRedoPolicy,
  REDO_POLICY_DEFAULTS,
  type RedoPolicySettings as RedoPolicyType,
} from '@/hooks/useRedoPolicySettings';

export function RedoPolicySettings() {
  const { data: policy, isLoading } = useRedoPolicySettings();
  const updatePolicy = useUpdateRedoPolicy();
  const [local, setLocal] = useState<RedoPolicyType>(REDO_POLICY_DEFAULTS);

  useEffect(() => {
    if (policy) setLocal(policy);
  }, [policy]);

  const handleUpdate = (updates: Partial<RedoPolicyType>) => {
    const merged = { ...local, ...updates };
    setLocal(merged);
    updatePolicy.mutate(updates);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-primary" />
          <CardTitle className={tokens.heading.section}>REDO & ADJUSTMENT POLICY</CardTitle>
        </div>
        <CardDescription>
          Define how redos and adjustment services are priced, approved, and tracked.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pricing Policy */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Redo Pricing</Label>
          <RadioGroup
            value={local.redo_pricing_policy}
            onValueChange={(val) => handleUpdate({ redo_pricing_policy: val as RedoPolicyType['redo_pricing_policy'] })}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="free" id="redo-free" />
              <Label htmlFor="redo-free" className="text-sm cursor-pointer">Complimentary (no charge)</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="percentage" id="redo-percentage" />
              <Label htmlFor="redo-percentage" className="text-sm cursor-pointer">Percentage of original price</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="full_price" id="redo-full" />
              <Label htmlFor="redo-full" className="text-sm cursor-pointer">Full price</Label>
            </div>
          </RadioGroup>

          {local.redo_pricing_policy === 'percentage' && (
            <div className="pl-6 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Discount percentage</Label>
                <Badge variant="secondary" className="text-xs tabular-nums">
                  {local.redo_pricing_percentage}% of original
                </Badge>
              </div>
              <Slider
                value={[local.redo_pricing_percentage]}
                onValueChange={([val]) => setLocal(p => ({ ...p, redo_pricing_percentage: val }))}
                onValueCommit={([val]) => handleUpdate({ redo_pricing_percentage: val })}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Free</span>
                <span>Full price</span>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Redo Window */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              Redo Window
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] text-xs">
                  <p>Maximum days after the original appointment that a redo can be booked. Managers can still override.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <p className="text-xs text-muted-foreground">Days after original service</p>
          </div>
          <Input
            type="number"
            min={1}
            max={90}
            value={local.redo_window_days}
            onChange={(e) => {
              const val = Math.max(1, Math.min(90, parseInt(e.target.value) || 14));
              setLocal(p => ({ ...p, redo_window_days: val }));
            }}
            onBlur={() => handleUpdate({ redo_window_days: local.redo_window_days })}
            className="w-20 h-8 text-center text-sm"
          />
        </div>

        <div className="h-px bg-border" />

        {/* Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Require Reason</Label>
              <p className="text-xs text-muted-foreground">Force stylists to enter a reason for the redo</p>
            </div>
            <Switch
              checked={local.redo_reason_required}
              onCheckedChange={(val) => handleUpdate({ redo_reason_required: val })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Require Approval</Label>
              <p className="text-xs text-muted-foreground">Redos from non-managers need sign-off before confirming</p>
            </div>
            <Switch
              checked={local.redo_requires_approval}
              onCheckedChange={(val) => handleUpdate({ redo_requires_approval: val })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Manager Notification</Label>
              <p className="text-xs text-muted-foreground">Notify managers when a redo is booked</p>
            </div>
            <Switch
              checked={local.redo_notification_enabled}
              onCheckedChange={(val) => handleUpdate({ redo_notification_enabled: val })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
