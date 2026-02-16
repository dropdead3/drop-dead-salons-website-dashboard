import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { tokens } from '@/lib/design-tokens';
import type { Service } from '@/hooks/useServicesData';
import type { ServiceCategoryColor } from '@/hooks/useServiceCategoryColors';

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (service: Partial<Service>) => void;
  isPending: boolean;
  categories: ServiceCategoryColor[];
  initialData?: Service | null;
  mode: 'create' | 'edit';
}

export function ServiceFormDialog({ open, onOpenChange, onSubmit, isPending, categories, initialData, mode }: ServiceFormDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('60');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [requiresQualification, setRequiresQualification] = useState(false);
  const [allowSameDayBooking, setAllowSameDayBooking] = useState(true);
  const [leadTimeDays, setLeadTimeDays] = useState('0');

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name);
      setCategory(initialData.category || '');
      setDuration(String(initialData.duration_minutes || 60));
      setPrice(initialData.price != null ? String(initialData.price) : '');
      setDescription(initialData.description || '');
      setRequiresQualification(initialData.requires_qualification ?? false);
      setAllowSameDayBooking(initialData.allow_same_day_booking ?? true);
      setLeadTimeDays(String(initialData.lead_time_days || 0));
    } else if (open) {
      setName('');
      setCategory(categories[0]?.category_name || '');
      setDuration('60');
      setPrice('');
      setDescription('');
      setRequiresQualification(false);
      setAllowSameDayBooking(true);
      setLeadTimeDays('0');
    }
  }, [open, initialData, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: name.trim(),
      category: category || null,
      duration_minutes: parseInt(duration) || 60,
      price: price ? parseFloat(price) : null,
      description: description.trim() || null,
      requires_qualification: requiresQualification,
      allow_same_day_booking: allowSameDayBooking,
      lead_time_days: parseInt(leadTimeDays) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Service' : 'Edit Service'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Create a new service for your menu.' : 'Update service details.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-name">Name *</Label>
            <Input id="service-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Balayage, Men's Cut" autoFocus />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.category_name}>{c.category_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service-duration">Duration (min) *</Label>
              <Input id="service-duration" type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-price">Price ($)</Label>
              <Input id="service-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-description">Description</Label>
            <Textarea id="service-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional description" />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className={tokens.body.emphasis}>Requires Qualification</p>
                <p className={tokens.body.muted}>Only qualified stylists can book this service</p>
              </div>
              <Switch checked={requiresQualification} onCheckedChange={setRequiresQualification} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className={tokens.body.emphasis}>Same-Day Booking</p>
                <p className={tokens.body.muted}>Allow clients to book this service same day</p>
              </div>
              <Switch checked={allowSameDayBooking} onCheckedChange={setAllowSameDayBooking} />
            </div>

            {!allowSameDayBooking && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <Label htmlFor="lead-time">Lead Time (days)</Label>
                <Input id="lead-time" type="number" min="1" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'create' ? 'Create Service' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
