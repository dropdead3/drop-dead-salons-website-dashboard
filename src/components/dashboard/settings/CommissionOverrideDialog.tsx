import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUpsertCommissionOverride, StylistCommissionOverride } from '@/hooks/useStylistCommissionOverrides';

interface CommissionOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  override?: StylistCommissionOverride | null;
}

export function CommissionOverrideDialog({
  open,
  onOpenChange,
  organizationId,
  override,
}: CommissionOverrideDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [serviceRate, setServiceRate] = useState('');
  const [retailRate, setRetailRate] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const upsert = useUpsertCommissionOverride();

  const { data: stylists } = useQuery({
    queryKey: ['stylists-for-override', organizationId],
    enabled: open && !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('user_id, display_name, full_name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('display_name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (override) {
      setSelectedUserId(override.user_id);
      setServiceRate(override.service_commission_rate != null ? String(Math.round(override.service_commission_rate * 100)) : '');
      setRetailRate(override.retail_commission_rate != null ? String(Math.round(override.retail_commission_rate * 100)) : '');
      setReason(override.reason);
      setExpiresAt(override.expires_at ? override.expires_at.split('T')[0] : '');
    } else {
      setSelectedUserId('');
      setServiceRate('');
      setRetailRate('');
      setReason('');
      setExpiresAt('');
    }
  }, [override, open]);

  const handleSave = () => {
    if (!selectedUserId || !reason.trim()) return;

    upsert.mutate(
      {
        organization_id: organizationId,
        user_id: selectedUserId,
        service_commission_rate: serviceRate ? parseFloat(serviceRate) / 100 : null,
        retail_commission_rate: retailRate ? parseFloat(retailRate) / 100 : null,
        reason: reason.trim(),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{override ? 'Edit' : 'Add'} Commission Override</DialogTitle>
          <DialogDescription>
            Set a custom commission rate for an individual stylist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Stylist</Label>
            <select
              className="flex h-10 w-full rounded-full border border-input bg-background px-4 py-2 text-sm"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={!!override}
            >
              <option value="">Select a stylist...</option>
              {stylists?.map((s) => (
                <option key={s.user_id} value={s.user_id}>
                  {s.display_name || s.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service Commission %</Label>
              <Input
                type="number"
                placeholder="e.g. 45"
                value={serviceRate}
                onChange={(e) => setServiceRate(e.target.value)}
                min={0}
                max={100}
                autoCapitalize="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Retail Commission %</Label>
              <Input
                type="number"
                placeholder="e.g. 15"
                value={retailRate}
                onChange={(e) => setRetailRate(e.target.value)}
                min={0}
                max={100}
                autoCapitalize="off"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              placeholder="e.g. Negotiated contract, 90-day probation rate..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Expires (optional)</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              autoCapitalize="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!selectedUserId || !reason.trim() || upsert.isPending}>
            {upsert.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
