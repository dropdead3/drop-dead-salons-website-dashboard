import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCommissionTiers } from '@/hooks/useCommissionTiers';
import { Plus, Edit2, Trash2, Percent, Loader2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TierFormData {
  tier_name: string;
  min_revenue: number;
  max_revenue: number | null;
  commission_rate: number;
  applies_to: 'all' | 'services' | 'products';
}

const initialFormData: TierFormData = {
  tier_name: '',
  min_revenue: 0,
  max_revenue: null,
  commission_rate: 0.3,
  applies_to: 'services',
};

export function CommissionTiersEditor() {
  const { tiers, isLoading, updateTier, createTier } = useCommissionTiers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TierFormData>(initialFormData);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (tier: any) => {
    setEditingId(tier.id);
    setFormData({
      tier_name: tier.tier_name,
      min_revenue: tier.min_revenue,
      max_revenue: tier.max_revenue,
      commission_rate: tier.commission_rate,
      applies_to: tier.applies_to,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateTier({ id: editingId, ...formData });
    } else {
      createTier({ ...formData, is_active: true });
    }
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleDeactivate = (id: string) => {
    updateTier({ id, is_active: false });
  };

  const getAppliesLabel = (appliesTo: string) => {
    switch (appliesTo) {
      case 'all': return 'All Revenue';
      case 'services': return 'Services';
      case 'products': return 'Products';
      default: return appliesTo;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Commission Tiers
          </CardTitle>
          <CardDescription>Configure commission rates based on revenue thresholds</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Add'} Commission Tier</DialogTitle>
              <DialogDescription>
                Define commission rate for a revenue range
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tier_name">Tier Name</Label>
                <Input
                  id="tier_name"
                  value={formData.tier_name}
                  onChange={(e) => setFormData({ ...formData, tier_name: e.target.value })}
                  placeholder="e.g., Bronze, Silver, Gold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_revenue">Min Revenue</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="min_revenue"
                      type="number"
                      value={formData.min_revenue}
                      onChange={(e) => setFormData({ ...formData, min_revenue: Number(e.target.value) })}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_revenue">Max Revenue (blank = unlimited)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="max_revenue"
                      type="number"
                      value={formData.max_revenue || ''}
                      onChange={(e) => setFormData({ ...formData, max_revenue: e.target.value ? Number(e.target.value) : null })}
                      className="pl-8"
                      placeholder="∞"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={(formData.commission_rate * 100).toFixed(0)}
                  onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) / 100 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applies_to">Applies To</Label>
                <Select 
                  value={formData.applies_to} 
                  onValueChange={(v: 'all' | 'services' | 'products') => setFormData({ ...formData, applies_to: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Revenue</SelectItem>
                    <SelectItem value="services">Services Only</SelectItem>
                    <SelectItem value="products">Products Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Tier</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {tiers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No commission tiers configured</p>
            <p className="text-sm mt-1">Add tiers to calculate stylist commissions</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Revenue Range</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.tier_name}</TableCell>
                  <TableCell>
                    ${tier.min_revenue.toLocaleString()} - {tier.max_revenue ? `$${tier.max_revenue.toLocaleString()}` : '∞'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{(tier.commission_rate * 100).toFixed(0)}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getAppliesLabel(tier.applies_to)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(tier)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeactivate(tier.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
