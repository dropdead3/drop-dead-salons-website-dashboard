import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Package, Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/design-tokens';
import { useServiceAddons, useCreateServiceAddon, useUpdateServiceAddon, useDeleteServiceAddon, type ServiceAddon } from '@/hooks/useServiceAddons';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

interface ServiceAddonsLibraryProps {
  organizationId: string;
}

function computeMargin(price: number, cost: number | null): number | null {
  if (cost == null || price <= 0) return null;
  return ((price - cost) / price) * 100;
}

function MarginBadge({ margin }: { margin: number | null }) {
  if (margin == null) return <span className="text-xs text-muted-foreground">—</span>;
  const color = margin >= 50 ? 'text-emerald-600 bg-emerald-500/10' : margin >= 30 ? 'text-amber-600 bg-amber-500/10' : 'text-red-600 bg-red-500/10';
  return <Badge variant="outline" className={cn('text-[11px] font-medium border-0', color)}>{Math.round(margin)}% margin</Badge>;
}

export function ServiceAddonsLibrary({ organizationId }: ServiceAddonsLibraryProps) {
  const { data: addons = [], isLoading } = useServiceAddons(organizationId);
  const createAddon = useCreateServiceAddon();
  const updateAddon = useUpdateServiceAddon();
  const deleteAddon = useDeleteServiceAddon();
  const { formatCurrency } = useFormatCurrency();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [duration, setDuration] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setPrice('');
    setCost('');
    setDuration('');
  };

  const startEdit = (addon: ServiceAddon) => {
    setEditingId(addon.id);
    setName(addon.name);
    setPrice(String(addon.price));
    setCost(addon.cost != null ? String(addon.cost) : '');
    setDuration(addon.duration_minutes != null ? String(addon.duration_minutes) : '');
    setShowForm(false);
  };

  const handleSave = () => {
    if (!name.trim() || !price) return;
    const payload = {
      name: name.trim(),
      price: parseFloat(price),
      cost: cost ? parseFloat(cost) : null,
      duration_minutes: duration ? parseInt(duration) : null,
    };

    if (editingId) {
      updateAddon.mutate({ id: editingId, organizationId, ...payload }, { onSuccess: resetForm });
    } else {
      createAddon.mutate({ organization_id: organizationId, ...payload }, { onSuccess: resetForm });
    }
  };

  const isPending = createAddon.isPending || updateAddon.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <CardTitle className={tokens.heading.section}>SERVICE ADD-ONS</CardTitle>
          </div>
          {!showForm && !editingId && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Add-On
            </Button>
          )}
        </div>
        <CardDescription>
          Define reusable add-on services with pricing and cost tracking. Assign them to categories or specific services below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* New add-on form */}
        {showForm && (
          <div className="mb-4 p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">New Add-On</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Name (e.g. Olaplex Treatment)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="col-span-2 h-9 text-sm"
                autoCapitalize="words"
              />
              <Input
                placeholder="Price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="h-9 text-sm"
              />
              <Input
                placeholder="Cost (optional)"
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={e => setCost(e.target.value)}
                className="h-9 text-sm"
              />
              <Input
                placeholder="Duration (min)"
                type="number"
                min="0"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="h-9 text-sm"
              />
              <div className="flex items-center gap-1">
                {cost && price && (
                  <MarginBadge margin={computeMargin(parseFloat(price) || 0, parseFloat(cost) || null)} />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={!name.trim() || !price || isPending}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Add-ons list */}
        {addons.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No add-ons defined yet. Create your first add-on to start building recommendations.
          </p>
        )}

        <div className="space-y-1">
          {addons.map(addon => {
            const isEditing = editingId === addon.id;
            const margin = computeMargin(addon.price, addon.cost);

            if (isEditing) {
              return (
                <div key={addon.id} className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={name} onChange={e => setName(e.target.value)} className="col-span-2 h-9 text-sm" autoCapitalize="words" />
                    <Input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" className="h-9 text-sm" />
                    <Input type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="Cost" className="h-9 text-sm" />
                    <Input type="number" min="0" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration (min)" className="h-9 text-sm" />
                    <div className="flex items-center">
                      {cost && price && <MarginBadge margin={computeMargin(parseFloat(price) || 0, parseFloat(cost) || null)} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={!name.trim() || !price || isPending}>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div key={addon.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{addon.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs font-medium">{formatCurrency(addon.price)}</span>
                    {addon.cost != null && (
                      <span className="text-[11px] text-muted-foreground">Cost {formatCurrency(addon.cost)}</span>
                    )}
                    <MarginBadge margin={margin} />
                    {addon.duration_minutes && (
                      <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {addon.duration_minutes}m
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(addon)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(addon.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Add-On?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate the add-on and remove it from all booking recommendations. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteId) deleteAddon.mutate({ id: deleteId, organizationId });
                  setDeleteId(null);
                }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
