import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocations } from '@/hooks/useLocations';

interface NewClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: {
    id: string;
    phorest_client_id: string;
    name: string;
    email: string | null;
    phone: string | null;
  }) => void;
  defaultLocationId?: string;
}

export function NewClientDialog({
  open,
  onOpenChange,
  onClientCreated,
  defaultLocationId,
}: NewClientDialogProps) {
  const queryClient = useQueryClient();
  const { data: locations = [] } = useLocations();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [locationId, setLocationId] = useState(defaultLocationId || '');

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setLocationId(defaultLocationId || '');
  };

  const createClient = useMutation({
    mutationFn: async () => {
      const location = locations.find(l => l.id === locationId);
      if (!location?.phorest_branch_id) {
        throw new Error('Please select a location');
      }

      const response = await supabase.functions.invoke('create-phorest-client', {
        body: {
          branch_id: location.phorest_branch_id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to create client');

      return response.data.client;
    },
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['phorest-clients'] });
      toast.success('Client created successfully!');
      onClientCreated(client);
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to create client', { description: error.message });
    },
  });

  const canSubmit = firstName.trim() && lastName.trim() && (email.trim() || phone.trim()) && locationId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      createClient.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Client
          </DialogTitle>
          <DialogDescription>
            Create a new client in the system. They will be synced to Phorest.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          {defaultLocationId ? (
            <div className="rounded-md bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Location: </span>
              <span className="font-medium">
                {locations.find(l => l.id === defaultLocationId)?.name || 'Selected location'}
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            * Email or phone is required for contact
          </p>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special notes about this client..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!canSubmit || createClient.isPending}
            >
              {createClient.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Client
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
